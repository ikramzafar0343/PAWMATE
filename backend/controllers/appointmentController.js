const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Appointment = require('../models/Appointment');
const Pet = require('../models/Pet');
const User = require('../models/User');
const cacheService = require('../utils/cacheService');

// Cache TTL configuration
const APPOINTMENTS_CACHE_TTL_SEC = 300; // 5 minutes for appointments
const CACHE_KEY_PREFIX = 'appointments';

// @desc    Get appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = asyncHandler(async (req, res) => {
  // Performance timing
  const startTime = process.hrtime.bigint();
  const dbStartTime = process.hrtime.bigint();
  
  let query = {};
  
  // Filter by date if provided
  if (req.query.date) {
    query.date = req.query.date;
  }
  
  // Filter by vetId if provided (for pet owners to see specific vet appointments)
  if (req.query.vetId) {
    // Validate ObjectId if provided
    if (mongoose.Types.ObjectId.isValid(req.query.vetId)) {
      query.vetId = req.query.vetId;
    }
  }
  
  // Ensure user ID consistency - Mongoose handles ObjectId conversion automatically
  const userId = req.user._id || req.user.id;
  
  /* console.log('[getAppointments] User:', {
    id: userId,
    idString: userId.toString(),
    role: req.user.role
  }); */
  
  if (req.user.role === 'vet') {
      query.vetId = userId; // Mongoose will handle ObjectId conversion
  } else if (req.user.role === 'pet-owner') {
      query.ownerId = userId; // Mongoose will handle ObjectId conversion
  }
  // Admin sees all (no filter)
  
  // Admin sees all (no filter)
  
  // Check if cache should be bypassed (for benchmarking)
  const bypassCache = req.query.nocache === 'true' || req.query.nocache === '1';
  
  // Generate cache key
  const cacheKey = `${CACHE_KEY_PREFIX}:${userId}:${req.user.role}:${JSON.stringify(req.query)}`;
  const etagKey = `${cacheKey}:etag`;
  
  // Check cache first (fast path) - skip if bypassing cache
  if (!bypassCache) {
    try {
      const cached = await cacheService.get(cacheKey);
      const cachedEtag = await cacheService.get(etagKey);
      
      if (cached) {
        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch && cachedEtag === ifNoneMatch) {
          const duration = Number(process.hrtime.bigint() - startTime) / 1e6;
          console.log(`[Performance] getAppointments CACHE HIT in ${duration.toFixed(2)}ms`);
          res.set('ETag', cachedEtag);
          res.set('Cache-Control', 'private, max-age=300');
          return res.status(304).end();
        }
        
        const duration = Number(process.hrtime.bigint() - startTime) / 1e6;
        console.log(`[Performance] getAppointments CACHE HIT in ${duration.toFixed(2)}ms, returned ${cached.length || 0} appointments`);
        res.set('ETag', cachedEtag || crypto.createHash('md5').update(JSON.stringify(cached)).digest('hex'));
        res.set('Cache-Control', 'private, max-age=300');
        return res.status(200).json(cached);
      }
    } catch (error) {
      // Cache error - continue with DB query
      console.warn('[Cache] Error reading from cache:', error.message);
    }
  } else {
    // Cache bypass requested - log for benchmarking
    console.log('[Performance] getAppointments CACHE BYPASSED (nocache=true)');
  }

  // Pagination
  const page = Math.max(parseInt(req.query.page || '1', 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit || '20', 10) || 20, 50);
  const skip = (page - 1) * limit;

  // Convert ObjectId fields in query for aggregation pipeline
  const matchQuery = { ...query };
  if (matchQuery.ownerId && typeof matchQuery.ownerId === 'string') {
    matchQuery.ownerId = new mongoose.Types.ObjectId(matchQuery.ownerId);
  }
  if (matchQuery.vetId && typeof matchQuery.vetId === 'string') {
    matchQuery.vetId = new mongoose.Types.ObjectId(matchQuery.vetId);
  }
  if (matchQuery.petId && typeof matchQuery.petId === 'string') {
    matchQuery.petId = new mongoose.Types.ObjectId(matchQuery.petId);
  }
  
  // console.log('[getAppointments] Match query after conversion:', JSON.stringify(matchQuery));
  
  // Optimized: Use .find() with manual population for better performance
  // Parallel queries instead of aggregation for better performance
  const queryStartTime = process.hrtime.bigint();
  
  const nowLocal = new Date();
  const defaultStart = new Date(nowLocal.getTime() - 90 * 24 * 60 * 60 * 1000);
  const startDateStr = defaultStart.toISOString().split('T')[0];
  if (!req.query.date && !req.query.from && !req.query.to) {
    matchQuery.date = { $gte: startDateStr };
  } else {
    if (req.query.from || req.query.to) {
      const range = {};
      if (req.query.from) range.$gte = req.query.from;
      if (req.query.to) range.$lte = req.query.to;
      matchQuery.date = range;
    }
    if (req.query.date) {
      const dateStr = String(req.query.date);
      // Support both exact 'YYYY-MM-DD' strings and ISO strings starting with that date
      matchQuery.$or = [
        { date: dateStr },
        { date: { $regex: `^${dateStr}` } }
      ];
      delete matchQuery.date;
    }
  }
  const selectFields = (req.user.role === 'admin' || req.user.role === 'vet')
    ? 'petId vetId ownerId date time status type reason createdAt'
    : 'petId vetId date time status type reason createdAt';
  
  // Optimized: Fetch appointments first, then populate in parallel for better performance
  // This avoids multiple round-trips during the initial query
  let appointments = await Appointment.find(matchQuery)
    .select(selectFields)
    .sort({ date: 1, time: 1 })  // Sort before skip/limit for index usage
    .skip(skip)
    .limit(limit)
    .maxTimeMS(10000)  // Prevent runaway queries (10 seconds max)
    .lean();  // Get plain objects first
  
  // Parallel populate for better performance - populate after limiting results
  // This reduces database round-trips from N*3 to just 3 queries
  if (appointments.length > 0) {
    // Get unique IDs to populate (convert to ObjectId for queries)
    const petIds = [...new Set(
      appointments.map(a => a.petId).filter(Boolean).map(id => 
        typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
      )
    )];
    const vetIds = [...new Set(
      appointments.map(a => a.vetId).filter(Boolean).map(id => 
        typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
      )
    )];
    // For vets and admins, populate ownerId to show owner names
    const ownerIds = (req.user.role === 'admin' || req.user.role === 'vet')
      ? [...new Set(
          appointments.map(a => a.ownerId).filter(Boolean).map(id => 
            typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
          )
        )]
      : [];
    
    // Fetch all related documents in parallel (3 queries instead of N*3)
    const [pets, vets, owners] = await Promise.all([
      petIds.length > 0 
        ? Pet.find({ _id: { $in: petIds } }).select('name breed image').lean()
        : Promise.resolve([]),
      vetIds.length > 0
        ? User.find({ _id: { $in: vetIds } }).select('name image clinicName specialization').lean()
        : Promise.resolve([]),
      ownerIds.length > 0
        ? User.find({ _id: { $in: ownerIds } }).select('name email image').lean()
        : Promise.resolve([])
    ]);
    
    // Create lookup maps for O(1) access (handle both ObjectId and string keys)
    const petsMap = new Map(pets.map(p => [p._id.toString(), p]));
    const vetsMap = new Map(vets.map(v => [v._id.toString(), v]));
    const ownersMap = new Map(owners.map(o => [o._id.toString(), o]));
    
    // Manually populate the appointments (handle both ObjectId and string IDs)
    appointments = appointments.map(appt => ({
      ...appt,
      petId: appt.petId ? (petsMap.get(appt.petId.toString()) || null) : null,
      vetId: appt.vetId ? (vetsMap.get(appt.vetId.toString()) || null) : null,
      ownerId: (req.user.role === 'admin' || req.user.role === 'vet') && appt.ownerId
        ? (ownersMap.get(appt.ownerId.toString()) || null)
        : appt.ownerId
    }));
  }
  
  // Dynamic status calculation
  const now = new Date();
  
  appointments = appointments.map(appt => {
    try {
      // Robust date parsing (Handle ISO string or YYYY-MM-DD)
      let dateStr = appt.date;
      if (dateStr && dateStr.includes('T')) {
         dateStr = dateStr.split('T')[0];
      }
      
      const [year, month, day] = dateStr.split('-').map(Number);
      
      let hours = 0;
      let minutes = 0;
      
      if (appt.time && appt.time.includes(' ')) {
        const [timePart, period] = appt.time.split(' ');
        const [h, m] = timePart.split(':').map(Number);
        hours = h;
        minutes = m;
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
      } else if (appt.time) {
        // Fallback for 24h format
        const [h, m] = appt.time.split(':').map(Number);
        hours = h;
        minutes = m;
      }
      
      const start = new Date(year, month - 1, day, hours, minutes);
      const end = new Date(start.getTime() + 30 * 60000); // Default 30 minutes duration
      
      let dynamicStatus = appt.status; 
      
      // Override status based on time logic, ONLY if not Cancelled or Completed
      if (appt.status !== 'Cancelled' && appt.status !== 'Completed') {
         if (start > now) {
           dynamicStatus = 'Pending';
         } else if (start <= now && now < end) {
           dynamicStatus = 'In Progress';
         } else if (end <= now) {
           dynamicStatus = 'Completed';
         }
      }
      
      return {
        ...appt,
        status: dynamicStatus,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        originalStatus: appt.status
      };
    } catch (e) {
  if (process.env.DEBUG === 'true') {
    console.error('Debug: appointment status calculation failed:', e.message);
  }
      return appt;
    }
  });

  // Calculate DB query duration
  const queryDuration = Number(process.hrtime.bigint() - queryStartTime) / 1e6;
  
  // Generate ETag from data hash
  const dataString = JSON.stringify(appointments);
  const etag = crypto.createHash('md5').update(dataString).digest('hex');
  
  cacheService.set(cacheKey, appointments, APPOINTMENTS_CACHE_TTL_SEC);
  cacheService.set(etagKey, etag, APPOINTMENTS_CACHE_TTL_SEC);
  
  // Set ETag header
  res.set('ETag', etag);
  res.set('Cache-Control', 'private, max-age=300');
  
  const totalDuration = Number(process.hrtime.bigint() - startTime) / 1e6;
  const { infoRequest } = require('../utils/logger');
  infoRequest({
    method: req.method,
    url: req.originalUrl,
    status: 200,
    label: 'appointments',
    count: appointments.length,
    dbMs: queryDuration,
    totalMs: totalDuration
  });
  res.locals.requestLogged = true;
  
  res.status(200).json(appointments);
});

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = asyncHandler(async (req, res) => {
  const { petId, vetId, date, time, reason, type } = req.body;

  if (!petId || !vetId || !date || !time) {
    res.status(400);
    throw new Error('Please add all required fields: petId, vetId, date, time');
  }

  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(petId)) {
    res.status(400);
    throw new Error('Invalid pet ID');
  }
  
  if (!mongoose.Types.ObjectId.isValid(vetId)) {
    res.status(400);
    throw new Error('Invalid veterinarian ID');
  }

  // Verify pet belongs to owner (if not admin/vet) and vet exists in parallel
  const [pet, vet] = await Promise.all([
    req.user.role === 'pet-owner' ? require('../models/Pet').findById(petId).lean() : Promise.resolve(null),
    User.findById(vetId).select('role status').lean()
  ]);

  if (req.user.role === 'pet-owner') {
    if (!pet || pet.ownerId.toString() !== (req.user._id || req.user.id).toString()) {
      res.status(401);
      throw new Error('Not authorized to create appointment for this pet');
    }
  }

  if (!vet || vet.role !== 'vet' || vet.status !== 'active') {
    res.status(400);
    throw new Error('Invalid veterinarian selected');
  }

  // Ensure consistent user ID format
  const ownerId = req.user._id || req.user.id;
  
  if (process.env.DEBUG === 'true') {
    console.log('[DEBUG] Creating appointment', { petId, vetId, ownerId: ownerId.toString(), date, time, role: req.user.role });
  }
  
  // Mongoose automatically converts strings to ObjectIds
  const appointment = await Appointment.create({
    petId,
    vetId,
    ownerId,
    date,
    time,
    reason: reason || 'General Consultation',
    type: type || 'General Checkup',
    status: 'Scheduled'
  });
  
  if (process.env.DEBUG === 'true') {
    console.log('[DEBUG] Created appointment', { _id: appointment._id, petId: String(appointment.petId), vetId: String(appointment.vetId) });
  }

  // Populate before returning
  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate('petId', 'name breed image')
    .populate('vetId', 'name image clinicName')
    .populate('ownerId', 'name email image')
    .lean();

  // Invalidate cache for owner and vet (async - don't block response)
  const ownerIdString = ownerId.toString();
  const vetIdString = vetId.toString();
  cacheService.delPattern(`${CACHE_KEY_PREFIX}:${ownerIdString}:*`);
  cacheService.delPattern(`${CACHE_KEY_PREFIX}:${vetIdString}:*`);
  
  // Also invalidate admin cache
  cacheService.delPattern(`${CACHE_KEY_PREFIX}:*:admin:*`);

  res.status(201).json(populatedAppointment);
});

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (Vet/Admin/Owner for cancellation)
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const appointmentId = req.params.id;
  
  // Validate ObjectId format
  if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) {
    res.status(400);
    throw new Error('Invalid appointment ID');
  }
  
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  // Validate status value
  const validStatuses = ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  // Owners can only cancel their appointments
  if (req.user.role === 'pet-owner') {
    if (status !== 'Cancelled') {
      res.status(401);
      throw new Error('Pet owners can only cancel appointments');
    }
    if (appointment.ownerId.toString() !== (req.user._id || req.user.id).toString()) {
      res.status(401);
      throw new Error('Not authorized to cancel this appointment');
    }
  } else if (req.user.role !== 'vet' && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Not authorized to update status');
  }

  // If vet, check if it's their appointment (unless admin)
  if (req.user.role === 'vet' && appointment.vetId.toString() !== (req.user._id || req.user.id).toString()) {
    res.status(401);
    throw new Error('Not authorized to update this appointment');
  }

  appointment.status = status;
  await appointment.save();

  // Invalidate cache for owner and vet
  const ownerId = appointment.ownerId.toString();
  const vetId = appointment.vetId.toString();
  cacheService.delPattern(`${CACHE_KEY_PREFIX}:${ownerId}:*`);
  cacheService.delPattern(`${CACHE_KEY_PREFIX}:${vetId}:*`);
  cacheService.delPattern(`${CACHE_KEY_PREFIX}:*:admin:*`);

  // Populate before returning
  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate('petId', 'name breed image')
    .populate('vetId', 'name image clinicName')
    .populate('ownerId', 'name email image')
    .lean();

  res.status(200).json(populatedAppointment);
});

// @desc    Get active consultations (currently in progress)
// @route   GET /api/consultations/active
// @access  Private
const getActiveConsultations = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  
  const query = {};
  if (req.user.role === 'vet') {
    query.vetId = userId;
  } else if (req.user.role === 'pet-owner') {
    query.ownerId = userId;
  }
  
  // Exclude Cancelled and Completed from DB fetch
  query.status = { $nin: ['Cancelled', 'Completed'] };
  
  // Limit to today's date to avoid scanning entire collection
  const nowLocal = new Date();
  const todayStr = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`;
  query.date = todayStr;
  
  // Use aggregation pipeline for better performance
  const pipeline = [
    { $match: query },
    {
      $lookup: {
        from: 'pets',
        localField: 'petId',
        foreignField: '_id',
        as: 'petId',
        pipeline: [
          { $project: { name: 1, breed: 1, image: 1 } }
        ]
      }
    },
    { $unwind: { path: '$petId', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'vetId',
        foreignField: '_id',
        as: 'vetId',
        pipeline: [
          { $project: { name: 1, image: 1, clinicName: 1 } }
        ]
      }
    },
    { $unwind: { path: '$vetId', preserveNullAndEmptyArrays: true } },
    { $project: { petId: 1, vetId: 1, ownerId: 1, date: 1, time: 1, status: 1, type: 1, reason: 1 } }
  ];
  
  let appointments = await Appointment.aggregate(pipeline).allowDiskUse(true);
    
  const now = new Date();
  
  const active = appointments.filter(appt => {
    try {
      const [year, month, day] = appt.date.split('-').map(Number);
      let hours = 0, minutes = 0;
      
      if (appt.time.includes(' ')) {
        const [timePart, period] = appt.time.split(' ');
        const [h, m] = timePart.split(':').map(Number);
        hours = h; minutes = m;
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
      } else {
        const [h, m] = appt.time.split(':').map(Number);
        hours = h; minutes = m;
      }
      
      const start = new Date(year, month - 1, day, hours, minutes);
      const end = new Date(start.getTime() + 30 * 60000); // 30 min duration
      
      // Active if NOW is between Start and End
      return start <= now && now < end;
    } catch (e) {
      return false;
    }
  }).map(appt => {
      // Re-calculate dates for response
      const [year, month, day] = appt.date.split('-').map(Number);
      let hours = 0, minutes = 0;
      if (appt.time.includes(' ')) {
        const [timePart, period] = appt.time.split(' ');
        const [h, m] = timePart.split(':').map(Number);
        hours = h; minutes = m;
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
      } else {
        const [h, m] = appt.time.split(':').map(Number);
        hours = h; minutes = m;
      }
      const start = new Date(year, month - 1, day, hours, minutes);
      const end = new Date(start.getTime() + 30 * 60000);
      
      return {
        ...appt,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'In Progress'
      };
  });
  
  // Disable caching for real-time accuracy
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  res.json(active);
});

// @desc    Mark consultation as complete
// @route   PUT /api/consultations/:id/complete
// @access  Private (Vet/Admin)
const completeConsultation = asyncHandler(async (req, res) => {
  const appointmentId = req.params.id;
  
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    res.status(400); throw new Error('Invalid ID');
  }
  
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    res.status(404); throw new Error('Consultation not found');
  }
  
  // Auth check
  if (req.user.role !== 'vet' && req.user.role !== 'admin') {
     res.status(401); throw new Error('Not authorized');
  }
  if (req.user.role === 'vet' && appointment.vetId.toString() !== (req.user._id || req.user.id).toString()) {
     res.status(401); throw new Error('Not authorized');
  }
  
  appointment.status = 'Completed';
  await appointment.save();
  
  // Clear cache
  const ownerId = appointment.ownerId.toString();
  const vetId = appointment.vetId.toString();
  
  for (const key of appointmentsCache.keys()) {
    if (key.includes(`_${ownerId}_`) || key.includes(`_${vetId}_`)) {
      appointmentsCache.delete(key);
    }
  }

  res.json(appointment);
});

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  // Check authorization
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;

  if (userRole === 'pet-owner' && appointment.ownerId.toString() !== userId.toString()) {
    res.status(401);
    throw new Error('Not authorized to delete this appointment');
  }
  if (userRole === 'vet' && appointment.vetId.toString() !== userId.toString()) {
    res.status(401);
    throw new Error('Not authorized to delete this appointment');
  }

  await appointment.deleteOne();

  // Invalidate cache for owner and vet
  const ownerId = appointment.ownerId.toString();
  const vetId = appointment.vetId.toString();
  cacheService.delPattern(`${CACHE_KEY_PREFIX}:${ownerId}:*`);
  cacheService.delPattern(`${CACHE_KEY_PREFIX}:${vetId}:*`);
  cacheService.delPattern(`${CACHE_KEY_PREFIX}:*:admin:*`);

  res.status(200).json({ id: req.params.id });
});

// @desc    Get revenue for a date, scoped by role
// @route   GET /api/appointments/revenue
// @access  Private
const getRevenue = asyncHandler(async (req, res) => {
  const start = process.hrtime.bigint();
  const userId = req.user._id || req.user.id;
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const date = req.query.date || `${yyyy}-${mm}-${dd}`;
  const match = { status: { $nin: ['Cancelled'] } };
  // Robust date match: exact 'YYYY-MM-DD' or ISO starting with it
  match.$or = [{ date }, { date: { $regex: `^${date}` } }];
  if (req.user.role === 'vet') match.vetId = userId;
  if (req.user.role === 'pet-owner') match.ownerId = userId;
  
  const dbStart = process.hrtime.bigint();
  const appts = await Appointment.find(match)
    .select('vetId type status')
    .lean()
    .maxTimeMS(3000);
  const dbMs = Number(process.hrtime.bigint() - dbStart) / 1e6;
  
  // Build vet fees map
  const vetIds = [...new Set(appts.map(a => a.vetId?.toString()).filter(Boolean))];
  const vets = vetIds.length > 0
    ? await User.find({ _id: { $in: vetIds } }).select('consultationFees').lean()
    : [];
  const feesMap = new Map(vets.map(v => [v._id.toString(), v.consultationFees || { chat: 0, video: 0, visit: 0 }]));
  
  const pickFee = (type, fees) => {
    const t = (type || '').toLowerCase();
    if (t.includes('chat')) return fees.chat ?? 0;
    if (t.includes('video')) return fees.video ?? 0;
    if (t.includes('visit') || t.includes('clinic') || t.includes('check')) return fees.visit ?? 0;
    return fees.visit ?? fees.video ?? fees.chat ?? 0;
  };
  
  let total = 0;
  const breakdown = { chat: 0, video: 0, visit: 0, other: 0 };
  for (const a of appts) {
    const fees = feesMap.get(a.vetId?.toString()) || { chat: 0, video: 0, visit: 0 };
    const fee = pickFee(a.type, fees);
    total += fee;
    const t = (a.type || '').toLowerCase();
    if (t.includes('chat')) breakdown.chat += fee;
    else if (t.includes('video')) breakdown.video += fee;
    else if (t.includes('visit') || t.includes('clinic') || t.includes('check')) breakdown.visit += fee;
    else breakdown.other += fee;
  }
  
  const totalMs = Number(process.hrtime.bigint() - start) / 1e6;
  const { infoRequest } = require('../utils/logger');
  infoRequest({
    method: req.method,
    url: req.originalUrl,
    status: 200,
    label: 'appointments',
    count: appts.length,
    dbMs,
    totalMs
  });
  res.locals.requestLogged = true;
  
  res.status(200).json({
    date,
    count: appts.length,
    totalRevenue: total,
    breakdown
  });
});

module.exports = {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  getActiveConsultations,
  completeConsultation,
  deleteAppointment,
  getRevenue
};

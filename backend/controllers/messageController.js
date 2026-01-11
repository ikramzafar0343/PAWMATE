const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Message = require('../models/Message');
const cacheService = require('../utils/cacheService');
const mongoose = require('mongoose');

// Cache TTL configuration
const MESSAGES_CACHE_TTL_SEC = 10; // 10 seconds for messages (more frequent updates for real-time feel)
const CACHE_KEY_PREFIX = 'messages';

// @desc    Get messages between current user and another user
// @route   GET /api/messages/:userId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id || req.user._id;
  
  // Pagination support - define before using in cache key
  const page = Math.max(parseInt(req.query.page || '1', 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit || '200', 10) || 200, 500);
  const skip = (page - 1) * limit;
  
  // Check if cache should be bypassed (for benchmarking)
  const bypassCache = req.query.nocache === 'true' || req.query.nocache === '1';
  
  // Generate cache key
  const cacheKey = `${CACHE_KEY_PREFIX}:${currentUserId}:${userId}:${page}:${limit}`;
  const etagKey = `${cacheKey}:etag`;
  
  // Check cache - skip if bypassing cache
  if (!bypassCache) {
    try {
      const cached = await cacheService.get(cacheKey);
      const cachedEtag = await cacheService.get(etagKey);
      
      if (cached) {
        console.log(`[Messages] Returning cached messages (${cached.length} messages)`);
        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch && cachedEtag === ifNoneMatch) {
          res.set('ETag', cachedEtag);
          return res.status(304).end();
        }
        
        res.set('ETag', cachedEtag || crypto.createHash('md5').update(JSON.stringify(cached)).digest('hex'));
        res.set('Cache-Control', 'private, max-age=10');
        return res.status(200).json(cached);
      }
    } catch (error) {
      // Cache error - continue with DB query
      console.log('[Messages] Cache error, fetching from DB');
    }
  } else if (process.env.DEBUG === 'true') {
    console.log('[DEBUG] Messages cache bypassed');
  }

  // Optimized query with proper order and indexes
  // Fix: sort and limit must come BEFORE lean()
  const totalStart = process.hrtime.bigint();
  
const aId = String(currentUserId);
const bId = String(userId);
const convId = aId < bId ? `${aId}_${bId}` : `${bId}_${aId}`;
const messagesQuery = Message.find({ conversationId: convId })
  .select('sender receiver content type fileUrl fileSize createdAt appointmentId conversationId')
  .sort({ createdAt: 1 })
  .skip(skip)
  .limit(limit)
  .maxTimeMS(3000);
  
  const simple = req.query.simple === 'true';
  const dbStart = process.hrtime.bigint();
  let messages;
  if (simple) {
    messages = await messagesQuery.lean();
  } else {
    messages = await messagesQuery
      .populate('sender', 'name image')
      .populate('receiver', 'name image')
      .lean();
  }
  const dbMs = Number(process.hrtime.bigint() - dbStart) / 1e6;
  // Generate ETag for caching
  const dataString = JSON.stringify(messages);
  const etag = crypto.createHash('md5').update(dataString).digest('hex');
  
  cacheService.set(cacheKey, messages, MESSAGES_CACHE_TTL_SEC);
  cacheService.set(etagKey, etag, MESSAGES_CACHE_TTL_SEC);
  
  res.set('ETag', etag);
  res.set('Cache-Control', 'private, max-age=10');
  const totalMs = Number(process.hrtime.bigint() - totalStart) / 1e6;
  const { infoRequest } = require('../utils/logger');
  infoRequest({
    method: req.method,
    url: req.originalUrl,
    status: 200,
    label: 'messages',
    count: messages.length,
    dbMs,
    totalMs
  });
  res.locals.requestLogged = true;
  res.json(messages);
});

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content, type, fileUrl, fileSize, base64, appointmentId } = req.body;

  if (!receiverId || !content) {
    res.status(400);
    throw new Error('Receiver and content are required');
  }

const sId = String(req.user.id || req.user._id);
const rId = String(receiverId);
const conversationId = sId < rId ? `${sId}_${rId}` : `${rId}_${sId}`;
const participants = [
  mongoose.Types.ObjectId.isValid(sId) ? new mongoose.Types.ObjectId(sId) : sId,
  mongoose.Types.ObjectId.isValid(rId) ? new mongoose.Types.ObjectId(rId) : rId
];
const sentMessage = await Message.create({
  sender: req.user.id,
  receiver: receiverId,
  participants,
  conversationId,
  content,
  type: type || 'text',
  fileUrl: fileUrl || '',
  fileSize: fileSize || '',
  base64: base64 || '',
  appointmentId: appointmentId || null,
});

  const populated = await Message.findById(sentMessage._id)
    .populate('sender', 'name image')
    .populate('receiver', 'name image');

  // Invalidate cache for this conversation (sync to ensure it's cleared)
  const senderId = sentMessage.sender.toString();
  const messageReceiverId = sentMessage.receiver.toString();
  
  // Clear cache for both directions of the conversation
  try {
    const patternConv = `${CACHE_KEY_PREFIX}:${conversationId}:*`;
    const patternPair1 = `${CACHE_KEY_PREFIX}:${senderId}:${messageReceiverId}:*`;
    const patternPair2 = `${CACHE_KEY_PREFIX}:${messageReceiverId}:${senderId}:*`;
    
    cacheService.delPattern(patternConv);
    cacheService.delPattern(patternPair1);
    cacheService.delPattern(patternPair2);
  } catch (error) {
    console.error('[ERROR] Cache invalidation failed:', error.message);
  }

  res.status(201).json(populated);
});

module.exports = {
  getMessages,
  sendMessage,
  deleteMessage: asyncHandler(async (req, res) => {
    const messageId = req.params.id;
    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      res.status(400);
      throw new Error('Invalid message ID');
    }
    const doc = await Message.findById(messageId).lean();
    if (!doc) {
      res.status(404);
      throw new Error('Message not found');
    }
    const userIdStr = String(req.user._id || req.user.id);
    const isSender = String(doc.sender) === userIdStr;
    const isReceiver = String(doc.receiver) === userIdStr;
    if (!isSender && !isReceiver && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to delete this message');
    }
    await Message.deleteOne({ _id: messageId });
    try {
      const convId = doc.conversationId;
      const senderId = String(doc.sender);
      const receiverId = String(doc.receiver);
      cacheService.delPattern(`${CACHE_KEY_PREFIX}:${convId}:*`);
      cacheService.delPattern(`${CACHE_KEY_PREFIX}:${senderId}:${receiverId}:*`);
      cacheService.delPattern(`${CACHE_KEY_PREFIX}:${receiverId}:${senderId}:*`);
    } catch {}
    res.status(200).json({ id: messageId });
  }),
  // New: list unique conversations for current user with last message and unread count
  getConversations: asyncHandler(async (req, res) => {
    const meRaw = req.user._id || req.user.id;
    const meStr = String(meRaw);
    const meObj = mongoose.Types.ObjectId.isValid(meStr) ? new mongoose.Types.ObjectId(meStr) : null;
    const matchStage = meObj
      ? { $match: { participants: meObj } }
      : { $match: { $expr: { $in: [ meStr, { $map: { input: '$participants', as: 'p', in: { $toString: '$$p' } } } ] } } };
    const pipeline = [
      matchStage,
      { $sort: { createdAt: 1 } },
      { $group: {
          _id: '$conversationId',
          lastMessage: { $last: '$$ROOT' }
        } 
      },
      { $project: {
          conversationId: '$_id',
          participants: '$lastMessage.participants',
          counterpart: {
            $first: {
              $filter: {
                input: '$lastMessage.participants',
                as: 'p',
                cond: meObj ? { $ne: ['$$p', meObj] } : { $ne: [ { $toString: '$$p' }, meStr ] }
              }
            }
          },
          lastMessage: {
            content: '$lastMessage.content',
            createdAt: '$lastMessage.createdAt'
          }
        } 
      },
      { $lookup: { from: 'users', localField: 'counterpart', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: {
          userId: '$user._id',
          name: { $ifNull: ['$user.name', 'User'] },
          image: { $ifNull: ['$user.image', ''] },
          conversationId: 1,
          lastMessage: 1
        } 
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
      { $limit: 100 }
    ];
    const aggregateStart = process.hrtime.bigint();
    const conversations = await Message.aggregate(pipeline).allowDiskUse(true);
    const aggregateMs = Number(process.hrtime.bigint() - aggregateStart) / 1e6;
    const { infoRequest } = require('../utils/logger');
    infoRequest({
      method: req.method,
      url: req.originalUrl,
      status: 200,
      label: 'conversations',
      count: conversations.length,
      dbMs: aggregateMs,
      totalMs: aggregateMs
    });
    res.locals.requestLogged = true;
    res.status(200).json(conversations.map(c => ({
      userId: c.userId?.toString() || '',
      name: c.name,
      image: c.image,
      conversationId: c.conversationId,
      lastMessage: c.lastMessage,
      unreadCount: 0
    })));
  })
};

import { getAppointments } from './appointmentStore';
import API from '../api/client';

export const getConsultations = async () => {
    try {
        const appointments = await getAppointments();
        return appointments.map(appt => ({
            id: appt._id || appt.id,
            doctorName: appt.vetId ? appt.vetId.name : 'Unknown Vet',
            doctorImage: appt.vetId ? appt.vetId.image : '',
            petName: appt.petId ? appt.petId.name : 'Unknown Pet',
            petImage: appt.petId ? appt.petId.image : '',
            ownerName: appt.ownerId ? appt.ownerId.name : '',
            description: appt.reason,
            details: `${appt.petId ? appt.petId.name : 'Pet'} - ${appt.reason}`,
            status: appt.status.toLowerCase(),
            statusLabel: appt.status,
            statusColor: appt.status === 'Scheduled' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700',
            startTime: `${appt.date} ${appt.time}`,
            type: appt.type
        }));
    } catch (error) {
        console.error("Error fetching consultations", error);
        return [];
    }
};

export const getActiveConsultations = async () => {
    try {
        const response = await API.get('/consultations/active');
        return response.data.map(appt => ({
            id: appt._id || appt.id,
            doctorName: appt.vetId ? appt.vetId.name : 'Unknown Vet',
            doctorImage: appt.vetId ? appt.vetId.image : '',
            petName: appt.petId ? appt.petId.name : 'Unknown Pet',
            petImage: appt.petId ? appt.petId.image : '',
            ownerName: appt.ownerId ? appt.ownerId.name : '',
            description: appt.reason,
            details: `${appt.petId ? appt.petId.name : 'Pet'} - ${appt.reason}`,
            status: 'in-progress',
            statusLabel: 'In Progress',
            statusColor: 'bg-green-100 text-green-700',
            startTime: `${appt.date} ${appt.time}`,
            date: appt.date,
            time: appt.time,
            type: appt.type,
            start_time: appt.start_time,
            end_time: appt.end_time
        }));
    } catch (error) {
        console.error("Error fetching active consultations", error);
        return [];
    }
};

export const addConsultation = async (consultation) => {
  console.warn("addConsultation should be handled via addAppointment");
};

export const completeConsultation = async (id) => {
    try {
        // Check user role - only vets/admins can mark appointments as completed
        const userRole = localStorage.getItem('role');
        if (userRole !== 'vet' && userRole !== 'admin') {
            throw new Error('Only veterinarians can complete consultations');
        }
        await API.put(`/consultations/${id}/complete`);
    } catch (error) {
        console.error("Error completing consultation", error);
        throw error;
    }
};

export const resetConsultations = () => {
    // No-op
}

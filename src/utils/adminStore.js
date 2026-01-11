import API from '../api/client';

export const getActivities = async () => {
    try {
        const { data } = await API.get('/activities/feed');
        return data;
    } catch (error) {
        console.error("Error fetching activities", error);
        return [];
    }
};

export const getReports = async () => {
    try {
        const { data } = await API.get('/reports');
        return data;
    } catch (error) {
        console.error("Error fetching reports", error);
        return [];
    }
};

export const createReport = async (report) => {
    try {
        const { data } = await API.post('/reports', report);
        return data;
    } catch (error) {
        console.error("Error creating report", error);
        throw error;
    }
};

export const resolveReport = async (id) => {
    try {
        const { data } = await API.put(`/reports/${id}/resolve`);
        return data;
    } catch (error) {
        console.error("Error resolving report", error);
        throw error;
    }
};

export const getAnalytics = async () => {
    try {
        const { data } = await API.get('/users/stats/daily', { params: { days: 7 } });
        const series = Array.isArray(data.series) ? data.series : [];
        return series;
    } catch (error) {
        console.error("Error fetching analytics", error);
        return [];
    }
};

export const getQuickStats = async () => {
     try {
        const { data } = await API.get('/users/stats');
        return {
            totalUsers: data.totalUsers || 0,
            activeVets: data.activeVets || 0,
            totalPets: data.totalPets || 0,
            totalAppointments: data.totalAppointments || 0,
            revenue: 0,
            health: 99
        };
     } catch (error) {
        console.error("Error fetching quick stats", error);
        return { totalUsers: 0, activeVets: 0, totalPets: 0, totalAppointments: 0, revenue: 0, health: 0 };
     }
};

// Add Activity - Currently just a placeholder to satisfy imports
// In a real app, this would POST to an audit log endpoint
export const addActivity = async (activity) => {
    try {
        const { data } = await API.post('/activities', activity);
        return data;
    } catch (error) {
        console.error("Error adding activity", error);
        throw error;
    }
};

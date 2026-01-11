import API from '../api/client';

export const getListings = async (params = {}) => {
    try {
        const { data } = await API.get('/listings', { params });
        // Handle both old format (array) and new format (object with pagination)
        if (Array.isArray(data)) {
            return { listings: data, pagination: null };
        }
        return data;
    } catch (error) {
        console.error("Error fetching listings", error);
        return { listings: [], pagination: null };
    }
};

export const addListing = async (listing) => {
    try {
        const { data } = await API.post('/listings', listing);
        return data;
    } catch (error) {
        console.error("Error adding listing", error);
        throw error;
    }
};

export const updateListingStatus = async (id, status) => {
    try {
        const { data } = await API.put(`/listings/${id}/status`, { status });
        return data;
    } catch (error) {
        console.error("Error updating listing status", error);
        throw error;
    }
};

export const deleteListing = async (id) => {
    try {
        const { data } = await API.delete(`/listings/${id}`);
        return data;
    } catch (error) {
        console.error("Error deleting listing", error);
        throw error;
    }
};

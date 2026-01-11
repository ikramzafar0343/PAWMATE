import API from '../api/client';

export const getMessages = async (userId, appointmentId = null, bypassCache = false) => {
    try {
        const url = `/messages/${userId}${bypassCache ? '?nocache=true&t=' + Date.now() : ''}`;
        const { data } = await API.get(url);
        // Filter by appointmentId if provided
        if (appointmentId) {
            return data.filter(msg => msg.appointmentId === appointmentId || msg.appointmentId?._id === appointmentId);
        }
        return data;
    } catch (error) {
        console.error("Error fetching messages", error);
        return [];
    }
};

export const sendMessage = async (receiverId, content, type = 'text', fileData = null, appointmentId = null) => {
  try {
        // Ensure receiverId is a string
        const receiverIdStr = receiverId?.toString();
        
        if (!receiverIdStr) {
            throw new Error('Receiver ID is required');
        }
        
        if (!content || !content.trim()) {
            throw new Error('Message content is required');
        }
        
        const payload = {
            receiverId: receiverIdStr,
            content: content.trim(),
            type: type || 'text',
            appointmentId: appointmentId || null
        };
        
        if (fileData) {
            if (type === 'image' || type === 'file') {
                payload.fileUrl = fileData.fileUrl || '';
                payload.fileSize = fileData.fileSize || '';
                payload.base64 = fileData.base64 || '';
            }
        }
        
        console.log('Sending message payload:', { ...payload, content: content.substring(0, 50) + '...' });
        
        const { data } = await API.post('/messages', payload);
        return data;
  } catch (error) {
    console.error("Error sending message", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
};

export const getConversations = async () => {
  try {
    const { data } = await API.get('/messages/conversations');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching conversations", error);
    return [];
  }
};

export const deleteMessage = async (messageId) => {
  try {
    const { data } = await API.delete(`/messages/${messageId}`);
    return data;
  } catch (error) {
    console.error("Error deleting message", error);
    throw error;
  }
};

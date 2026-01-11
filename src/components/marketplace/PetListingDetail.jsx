import React, { useState, useCallback } from 'react';
import { FiMapPin, FiMessageCircle, FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import { deleteListing } from '../../utils/marketplaceStore';

const PetListingDetail = ({ listing, onBack, onChat }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Get current user ID
  const currentUserId = localStorage.getItem('userId') || localStorage.getItem('user_id');
  const sellerId = listing.sellerId?._id || listing.sellerId?.id || listing.sellerId;
  // Check if current user is the owner
  const isOwner = currentUserId && sellerId && (
    String(currentUserId) === String(sellerId) || 
    String(currentUserId).trim() === String(sellerId).trim()
  );
  
  // Debug logging
  console.log('[PetListingDetail] Owner check:', {
    currentUserId,
    sellerId,
    isOwner,
    listingId: listing._id || listing.id
  });

  const handleDelete = useCallback(async () => {
    if (!window.confirm(`Are you sure you want to delete "${listing.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const listingId = listing._id || listing.id;
      await deleteListing(listingId);
      
      // Trigger refresh and go back
      window.dispatchEvent(new Event('marketplaceRefresh'));
      onBack();
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [listing, onBack]);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="relative h-64 md:h-96">
        <img 
          src={listing.image} 
          alt={listing.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <button 
            onClick={onBack}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <FiArrowLeft className="text-xl text-gray-900" />
          </button>
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 bg-red-500/90 backdrop-blur-sm text-white rounded-full hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Delete listing"
              title="Delete listing"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FiTrash2 className="text-lg" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                {listing.type}
              </span>
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                {listing.breed}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.name}</h1>
            <div className="flex items-center gap-2 text-gray-500">
              <FiMapPin />
              {listing.location}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600 mb-1">{listing.price}</div>
            <div className="text-sm text-gray-500">Posted 2 days ago</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Age</p>
            <p className="font-bold text-gray-900">{listing.age}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Gender</p>
            <p className="font-bold text-gray-900">{listing.gender || 'Not specified'}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About {listing.name}</h2>
          <p className="text-gray-600 leading-relaxed">
            {listing.description}
          </p>
        </div>

        <div className="border-t border-gray-100 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Seller Information</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {(() => {
                // Get seller image from multiple possible sources
                const sellerImage = 
                  listing.sellerId?.image || 
                  listing.sellerId?.profileImage || 
                  listing.sellerId?.avatar ||
                  null;
                
                const sellerName = listing.sellerId?.name || listing.sellerId?.fullName || 'Seller';
                const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName.replace(/\s+/g, '+'))}&background=random&size=128`;
                
                return (
                  <div className="relative">
                    <img 
                      src={sellerImage || fallbackUrl} 
                      alt={sellerName} 
                      className="w-14 h-14 rounded-full object-cover bg-gray-100"
                      onError={(e) => {
                        // Fallback to generated avatar if image fails to load
                        if (e.target.src !== fallbackUrl) {
                          e.target.src = fallbackUrl;
                        }
                      }}
                    />
                  </div>
                );
              })()}
              <div>
                <p className="font-bold text-gray-900 text-lg">{listing.sellerId?.name || listing.sellerId?.fullName || 'Unknown Seller'}</p>
                <div className="flex items-center gap-1 text-sm text-yellow-500">
                  <span className="font-bold">{listing.sellerId?.rating || 'New'}</span>
                  <span className="text-gray-400">• Verified Seller</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isOwner ? (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FiTrash2 />
                      Delete Listing
                    </>
                  )}
                </button>
              ) : (
                <button 
                  onClick={() => {
                    if (!onChat) {
                      console.error('[PetListingDetail] onChat handler not provided');
                      alert('Chat functionality is not available. Please try again.');
                      return;
                    }
                    
                    // Prepare seller data with all necessary fields
                    const sellerData = {
                      _id: listing.sellerId?._id || listing.sellerId?.id || listing.sellerId,
                      id: listing.sellerId?._id || listing.sellerId?.id || listing.sellerId,
                      name: listing.sellerId?.name || listing.sellerId?.fullName || 'Unknown Seller',
                      fullName: listing.sellerId?.fullName || listing.sellerId?.name,
                      image: listing.sellerId?.image || listing.sellerId?.profileImage || listing.sellerId?.avatar || null,
                      email: listing.sellerId?.email || null
                    };
                    
                    console.log('[PetListingDetail] Starting chat with seller:', sellerData);
                    onChat(sellerData);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-200"
                >
                  <FiMessageCircle className="text-lg" />
                  Contact Seller
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetListingDetail;

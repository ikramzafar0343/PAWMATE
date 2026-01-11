import React, { useState, useCallback } from 'react';
import { FiMapPin, FiTag, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { addToCart } from '../../utils/cartStore';
import { deleteListing } from '../../utils/marketplaceStore';

const MarketplaceCard = React.memo(({ listing, onClick, onDelete }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Get current user ID
  const currentUserId = localStorage.getItem('userId') || localStorage.getItem('user_id');
  const sellerId = listing.sellerId?._id || listing.sellerId?.id || listing.sellerId;
  const isOwner = currentUserId && sellerId && String(currentUserId) === String(sellerId);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  const handleClick = useCallback(() => {
    onClick(listing);
  }, [listing, onClick]);

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    addToCart({
      id: listing.id || listing._id,
      name: listing.name,
      price: listing.price,
      image: listing.image
    });
  }, [listing]);

  const handleDelete = useCallback(async (e) => {
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete "${listing.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const listingId = listing._id || listing.id;
      await deleteListing(listingId);
      
      // Trigger refresh
      window.dispatchEvent(new Event('marketplaceRefresh'));
      
      // Call onDelete callback if provided
      if (onDelete) {
        onDelete(listingId);
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [listing, onDelete]);

  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="relative h-48 bg-gray-100">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
        )}
        <img 
          src={imageError ? 'https://via.placeholder.com/400x300?text=No+Image' : listing.image} 
          alt={listing.name} 
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
            <FiTag className="text-green-600" />
            {listing.price}
          </div>
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 bg-red-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Delete listing"
              title="Delete listing"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FiTrash2 size={16} />
              )}
            </button>
          )}
        </div>
        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1">
          <FiMapPin />
          {listing.location}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{listing.name}</h3>
            <p className="text-sm text-gray-500">{listing.breed} • {listing.age}</p>
          </div>
          {listing.type === 'For Sale' && (
            <button
              onClick={handleAddToCart}
              className="p-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
              aria-label="Add to cart"
              title="Add to cart"
            >
              <FiShoppingCart />
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
            {listing.type}
          </span>
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
            {listing.gender}
          </span>
        </div>
      </div>
    </div>
  );
});

MarketplaceCard.displayName = 'MarketplaceCard';

export default MarketplaceCard;

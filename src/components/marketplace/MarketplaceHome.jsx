import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FiSearch, FiFilter, FiPlus } from 'react-icons/fi';
import MarketplaceCard from './MarketplaceCard';
import CardSkeleton from './CardSkeleton';
import { getListings } from '../../utils/marketplaceStore';

const MarketplaceHome = ({ onNavigate, onSelectListing }) => {
  const [filter, setFilter] = useState('All');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const searchTimeoutRef = useRef(null);

  const fetchListings = useCallback(async (pageNum = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setListings([]);
      }
      
      const params = {
        page: pageNum,
        limit: 12,
        status: 'active'
      };
      
      if (filter !== 'All') {
        params.type = filter;
      }
      
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await getListings(params);
      const newListings = response.listings || [];
      
      // Deduplicate listings by ID
      const deduplicateListings = (listings) => {
        const seen = new Set();
        return listings.filter(listing => {
          const id = String(listing._id || listing.id);
          if (seen.has(id)) {
            console.warn(`[MarketplaceHome] Duplicate listing detected: ${id}`);
            return false;
          }
          seen.add(id);
          return true;
        });
      };
      
      if (reset) {
        setListings(deduplicateListings(newListings));
      } else {
        setListings(prev => {
          const combined = [...prev, ...newListings];
          return deduplicateListings(combined);
        });
      }
      
      setHasMore(response.pagination?.hasMore || false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 500); // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
    fetchListings(1, true);
  }, [filter, searchQuery, fetchListings]);

  // Listen for marketplace refresh events (e.g., after creating a new listing)
  useEffect(() => {
    const handleRefresh = () => {
      console.log('[MarketplaceHome] Refreshing listings...');
      fetchListings(1, true);
    };
    
    window.addEventListener('marketplaceRefresh', handleRefresh);
    return () => window.removeEventListener('marketplaceRefresh', handleRefresh);
  }, [fetchListings]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchListings(nextPage, false);
    }
  }, [loading, hasMore, page, fetchListings]);

  const handleSearch = useCallback((e) => {
    setSearchInput(e.target.value);
  }, []);

  // Memoize filtered listings with deduplication (client-side filtering removed, now server-side)
  const displayListings = useMemo(() => {
    const seen = new Set();
    return listings.filter(listing => {
      const id = String(listing._id || listing.id);
      if (seen.has(id)) {
        console.warn(`[MarketplaceHome] Duplicate listing in display: ${id}`);
        return false;
      }
      seen.add(id);
      return true;
    });
  }, [listings]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative flex-1 w-full md:w-auto">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input 
            type="text" 
            placeholder="Search for pets..." 
            value={searchInput}
            onChange={handleSearch}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          />
        </div>
        <button 
          onClick={() => onNavigate('add')}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-200 w-full md:w-auto justify-center"
        >
          <FiPlus />
          Sell / Adopt
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['All', 'For Sale', 'Adoption'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayListings.map((listing, index) => {
          const listingId = String(listing._id || listing.id);
          // Use composite key to ensure uniqueness
          return (
            <MarketplaceCard 
              key={`listing-${listingId}-${index}`} 
              listing={listing} 
              onClick={onSelectListing} 
            />
          );
        })}
        {loading && (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={`skeleton-${i}`} />
            ))}
          </>
        )}
      </div>

      {/* Load More Button */}
      {!loading && hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Load More
          </button>
        </div>
      )}

      {!loading && displayListings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No listings found. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(MarketplaceHome);

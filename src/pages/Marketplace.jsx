import React, { useState } from 'react';
import MarketplaceHome from '../components/marketplace/MarketplaceHome';
import PetListingDetail from '../components/marketplace/PetListingDetail';
import AddPetListing from '../components/marketplace/AddPetListing';
import BuyerSellerChat from '../components/marketplace/BuyerSellerChat';

const Marketplace = () => {
  const [view, setView] = useState('home'); // home, detail, add, chat
  const [selectedListing, setSelectedListing] = useState(null);
  const [chatPartner, setChatPartner] = useState(null);

  const handleSelectListing = (listing) => {
    setSelectedListing(listing);
    setView('detail');
  };

  const handleStartChat = (seller) => {
    // Ensure seller has all required fields
    const sellerData = {
      _id: seller._id || seller.id,
      id: seller._id || seller.id,
      name: seller.name || seller.fullName || 'Unknown Seller',
      fullName: seller.fullName || seller.name,
      image: seller.image || seller.profileImage || seller.avatar || null,
      email: seller.email || null
    };
    setChatPartner(sellerData);
    setView('chat');
  };

  const handleSubmitListing = () => {
    // Refresh the marketplace view to show the new listing
    setView('home');
    // Trigger a refresh by changing view state (component will remount)
    setTimeout(() => {
      window.dispatchEvent(new Event('marketplaceRefresh'));
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Dynamic Header based on view could be here, but simpler to keep it inside components or consistent */}
      {view === 'home' && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 mb-6">
          <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pet Marketplace</h1>
              <p className="text-gray-500 mt-1">Find your new best friend or find them a loving home</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4">
        {view === 'home' && (
          <MarketplaceHome 
            onNavigate={(v) => setView(v)} 
            onSelectListing={handleSelectListing} 
          />
        )}
        
        {view === 'detail' && selectedListing && (
          <PetListingDetail 
            listing={selectedListing} 
            onBack={() => setView('home')} 
            onChat={handleStartChat} 
          />
        )}

        {view === 'add' && (
          <AddPetListing 
            onBack={() => setView('home')} 
            onSubmit={handleSubmitListing} 
          />
        )}

        {view === 'chat' && chatPartner && (
          <div className="max-w-2xl mx-auto pt-6">
            <BuyerSellerChat 
              seller={chatPartner} 
              onBack={() => setView('detail')} // Or home, depending on flow
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;

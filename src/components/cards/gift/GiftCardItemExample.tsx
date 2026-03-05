import React from 'react';
import GiftCardItem from './GiftCardItem';
import { Gift } from '@/store/slices/giftListSlice';

export default function GiftCardItemExample() {
  const mockGifts: Gift[] = [
    {
      id: '1',
      name: 'Wireless Headphones',
      description: 'Noise-cancelling wireless headphones',
      price: 199.99,
      recipient: 'Dad',
      isCompleted: false,
      store: 'Best Buy',
      notes: 'He mentioned wanting new headphones',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Chocolate Box',
      description: 'Assorted chocolates',
      price: 25.5,
      recipient: 'Mom',
      isCompleted: true,
      completedDate: new Date().toISOString(),
      store: 'Godiva',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const handleToggle = (giftId: string) => {
    console.log('Toggle gift:', giftId);
  };

  const handleDelete = (giftId: string) => {
    console.log('Delete gift:', giftId);
  };

  const handleEdit = (gift: Gift) => {
    console.log('Edit gift:', gift);
  };

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        GiftCardItem Component Examples
      </h2>

      {/* Christmas Theme */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Christmas Theme</h3>
        <div className="card card-gifts rounded shadow">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {mockGifts.map(gift => (
              <GiftCardItem
                key={gift.id}
                gift={gift}
                isCompleted={gift.isCompleted}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
                theme={{
                  accentColor: '#eab308',
                }}
              />
            ))}
          </ul>
        </div>
      </div>

      {/* Valentine's Day Theme */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Valentine's Day Theme
        </h3>
        <div className="card card-gifts rounded shadow">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {mockGifts.map(gift => (
              <GiftCardItem
                key={gift.id}
                gift={gift}
                isCompleted={gift.isCompleted}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
                theme={{
                  accentColor: '#ec4899',
                  hoverColor: 'hover:bg-pink-50 dark:hover:bg-pink-900/20',
                }}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { upgradeUser } from '@/store/slices/userSlice';
import { useAuth0 } from '@auth0/auth0-react';

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

interface CreditCardForm {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  onUpgrade,
}: UpgradeModalProps) {
  const [currentPage, setCurrentPage] = useState<'features' | 'payment'>('features');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestMode, setIsTestMode] = useState(true); // Enable test mode by default
  const [formData, setFormData] = useState<CreditCardForm>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  const dispatch = useAppDispatch();
  const { user: auth0User } = useAuth0();
  const userState = useAppSelector(state => state.user);

  // Reset modal state when it opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPage('features');
      setFormData({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: '',
      });
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const features = [
    {
      key: 'invites',
      title: 'Invite Family & Friends',
      label: 'Invites',
      blurb:
        'Bring everyone into your holiday space. Share access, collaborate seamlessly, and plan together in one beautifully organized place.',
    },
    {
      key: 'assignments',
      title: 'Assign Tasks',
      label: 'Assignments',
      blurb:
        'Effortlessly delegate responsibilities, define ownership, and keep every detail moving forward with clarity and control.',
    },
    {
      key: 'budget',
      title: 'Budget Tracker',
      label: 'Budget',
      blurb:
        'Set your budget with confidence, track expenses, and stay perfectly aligned with your holiday spending goals.',
    },
    {
      key: 'gamification',
      title: 'Gamification',
      label: 'Gamification',
      blurb:
        'Activate Gamification Mode and transform the way you work. Earn points, track achievements, and turn everyday tasks into meaningful milestones',
    },
    {
      key: 'leaderboard',
      title: 'Leaderboard',
      label: 'Leaderboards',
      blurb:
        'Turn planning into a friendly competition. Climb the leaderboard, earn recognition, and make every contribution count.',
    },
    // {
    // 	key: "customHolidays",
    // 	title: "Custom Holidays",
    // 	label: "Custom Events",
    // 	blurb: "Create your own events with dates, colors, and sections.",
    // },
    // {
    // 	key: "smsInvites",
    // 	title: "Text Invites + Reply Tracking",
    // 	label: "Text Invites",
    // 	blurb: "Send SMS invites and capture replies automatically.",
    // },
  ];

  const handleUpgradeClick = () => {
    setCurrentPage('payment');
  };

  const handleBackToFeatures = () => {
    setCurrentPage('features');
    setFormData({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
    });
  };

  const handleInputChange = (field: keyof CreditCardForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmitPayment = async () => {
    setIsLoading(true);
    try {
      if (!auth0User?.sub) {
        throw new Error('User not authenticated');
      }

      // Step 1: Process payment (in test mode, this always succeeds)
      const paymentResponse = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardNumber: isTestMode
            ? '4111111111111111'
            : formData.cardNumber.replace(/\s/g, ''),
          expiryDate: isTestMode ? '12/25' : formData.expiryDate,
          cvv: isTestMode ? '123' : formData.cvv,
          cardholderName: formData.cardholderName,
          amount: 299, // $2.99 in cents
        }),
      });

      const paymentResult = await paymentResponse.json();

      if (paymentResponse.ok && paymentResult.success) {
        // Step 2: Update user subscription in database via Redux
        const upgradeResult = await dispatch(
          upgradeUser({
            auth0Sub: auth0User.sub,
            plan: 'plus',
          }),
        ).unwrap();

        // Success!
        console.log('Upgrade successful:', {
          payment: paymentResult,
          upgrade: upgradeResult,
        });

        onUpgrade();
        onClose();
      } else {
        throw new Error(paymentResult.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(
        `Payment failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }. Please try again.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    if (isTestMode) {
      // In test mode, just require cardholder name to be filled
      return formData.cardholderName.trim().length > 0;
    }

    // Full validation for production mode
    return (
      formData.cardNumber.replace(/\s/g, '').length >= 13 &&
      formData.expiryDate.length === 5 &&
      formData.cvv.length >= 3 &&
      formData.cardholderName.trim().length > 0
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="card rounded-lg p-4 sm:p-6 max-w-md mx-auto w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div
            className="text-lg sm:text-xl font-black text-gray-900 dark:text-white"
            style={{
              fontWeight: '900 !important',
              fontFamily:
                'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            }}
          >
            {currentPage === 'features'
              ? '✨ Upgrade to Plus'
              : '💳 Payment Details'}
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-lg sm:text-xl hover:scale-110 transition-transform duration-200"
          >
            ×
          </button>
        </div>

        {currentPage === 'features' ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Upgrade Benefits Section */}
            <div>
              <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">
                What you get with Plus:
              </h4>
              <ul className="space-y-3 sm:space-y-4">
                {features.map(feature => (
                  <li key={feature.key} className="flex items-start space-x-3">
                    <span className="text-green-500 text-base sm:text-lg mt-0.5">
                      ✓
                    </span>
                    <div className="flex-1">
                      <div className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                        {feature.title}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {feature.blurb}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-3 sm:p-4 rounded-lg">
              <div className="text-center">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  $2.99
                </span>
                <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  /month
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm sm:text-base text-gray-700 dark:text-gray-300 transition-all duration-200"
                style={{
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'rgb(249, 250, 251)';
                  e.currentTarget.style.borderColor = 'rgb(156, 163, 175)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'rgb(209, 213, 219)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpgradeClick}
                className="flex-1 bg-gradient-to-r from-purple-700 to-blue-700 text-white px-3 sm:px-4 py-2 rounded hover:opacity-80 transition-all duration-200 font-medium text-sm sm:text-base"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Test Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <div>
                <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Test Mode
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-300">
                  {isTestMode
                    ? 'Payment validation disabled for testing'
                    : 'Full payment validation enabled'}
                </div>
              </div>
              <button
                onClick={() => setIsTestMode(!isTestMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isTestMode ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isTestMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Credit Card Form */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Card Number{' '}
                  {isTestMode && (
                    <span className="text-yellow-600">(disabled in test mode)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.cardNumber}
                  onChange={e =>
                    handleInputChange('cardNumber', formatCardNumber(e.target.value))
                  }
                  placeholder={
                    isTestMode ? 'Test Mode - Not Required' : '1234 5678 9012 3456'
                  }
                  disabled={isTestMode}
                  className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm text-sm sm:text-base ${
                    isTestMode
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500'
                      : 'border-gray-600 dark:border-gray-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expiry Date{' '}
                    {isTestMode && (
                      <span className="text-yellow-600">(disabled)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.expiryDate}
                    onChange={e =>
                      handleInputChange(
                        'expiryDate',
                        formatExpiryDate(e.target.value),
                      )
                    }
                    placeholder={isTestMode ? 'Test' : 'MM/YY'}
                    disabled={isTestMode}
                    className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm text-sm sm:text-base ${
                      isTestMode
                        ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500'
                        : 'border-gray-600 dark:border-gray-400'
                    }`}
                    maxLength={5}
                    style={{ borderStyle: 'solid' as const }}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CVV{' '}
                    {isTestMode && (
                      <span className="text-yellow-600">(disabled)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.cvv}
                    onChange={e =>
                      handleInputChange('cvv', e.target.value.replace(/\D/g, ''))
                    }
                    placeholder={isTestMode ? 'Test' : '123'}
                    disabled={isTestMode}
                    className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm text-sm sm:text-base ${
                      isTestMode
                        ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500'
                        : 'border-gray-600 dark:border-gray-400'
                    }`}
                    maxLength={4}
                    style={{ borderStyle: 'solid' as const }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={formData.cardholderName}
                  onChange={e => handleInputChange('cardholderName', e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border-2 border-gray-600 dark:border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm text-sm sm:text-base"
                  style={{ borderStyle: 'solid' as const }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleBackToFeatures}
                disabled={isLoading}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm sm:text-base text-gray-700 dark:text-gray-300 transition-all duration-200 disabled:opacity-50"
                style={{
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={e => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = 'rgb(249, 250, 251)';
                    e.currentTarget.style.borderColor = 'rgb(156, 163, 175)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'rgb(209, 213, 219)';
                }}
              >
                Back
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={!isFormValid() || isLoading}
                className="flex-1 bg-gradient-to-r from-purple-700 to-blue-700 text-white px-3 sm:px-4 py-2 rounded hover:opacity-80 transition-all duration-200 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? 'Processing...'
                  : isTestMode
                    ? 'Test Upgrade (No Charge)'
                    : 'Submit Payment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

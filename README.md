# Next Holiday 🎄

A comprehensive holiday planning application built with Next.js, React, and Redux Toolkit. Plan, organize, and track all your holiday celebrations in one beautiful, gamified interface.

## 🌟 Features

### 🎯 Core Functionality

- **Multi-Holiday Support**: Plan for 15+ different holidays and celebrations
- **Gamified UI**: Toggle between professional and gamified display modes
- **Dark/Light Theme**: Full theme customization with smooth transitions
- **Progress Tracking**: Visual progress indicators for all holiday preparations
- **Countdown Timers**: Real-time countdown to upcoming holidays
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### 🔐 Authentication & User Management

- **Auth0 Integration**: Secure OAuth authentication with multiple providers
- **User Profiles**: Customizable profile pictures, names, and email addresses
- **Settings Management**: Comprehensive user preferences and holiday selections
- **Data Persistence**: Redux Persist for maintaining user data across sessions

### 🎁 Gift Management

- **Gift Lists**: Create and manage gift lists for each holiday
- **Budget Tracking**: Set and monitor individual holiday budgets
- **Recipient Management**: Link gifts to contacts from your address book
- **Store Information**: Track where gifts are purchased
- **Product Links**: Store direct links to gift items
- **Completion Tracking**: Mark gifts as purchased/wrapped/delivered
- **Sorting Options**: Sort by recipient, store, price (high/low)

### 📝 Task Management

- **To-Do Lists**: Create detailed task lists for each holiday
- **Priority Levels**: Set high, medium, or low priority for tasks
- **Due Dates**: Assign deadlines to tasks
- **Categories**: Organize tasks by category
- **Assignment**: Assign tasks to specific people
- **Progress Tracking**: Visual completion status
- **Sorting**: Sort by priority, due date, assigned person, or category

### 📧 Card Management

- **Greeting Cards**: Track holiday cards for each celebration
- **Recipient Lists**: Manage who receives cards
- **Address Storage**: Store mailing addresses
- **Personal Messages**: Add custom messages to each card
- **Completion Status**: Track which cards have been sent
- **Sorting**: Sort by recipient, address, message, or creation date

### 👥 Address Book

- **Contact Management**: Comprehensive contact database
- **Relationship Categories**: Organize contacts by relationship type
- **Address Storage**: Complete address information with US state support
- **Contact Details**: Phone, email, and additional notes
- **Sorting Options**: Sort alphabetically, by relationship, or location
- **Search & Filter**: Easy contact lookup and organization

### 🎉 Holiday-Specific Features

#### Christmas

- Gift lists with budget tracking
- Holiday card management
- Task organization
- Address book integration
- Countdown timer

#### Hanukkah

- Gift planning for 8 nights
- Candle lighting schedule
- Traditional gift categories
- Progress tracking

#### Kwanzaa

- Daily principles tracking
- Gift management
- Event planning
- Cultural celebration features

#### Valentine's Day

- Romantic gift planning
- Date idea suggestions
- Restaurant reservations
- Special event tracking

#### Easter

- Easter basket planning
- Egg hunt organization
- Gift management
- Decoration planning

#### Halloween

- Costume planning
- Trick-or-treat preparation
- Decoration management
- Party planning

#### Thanksgiving

- Meal planning
- Guest list management
- Shopping lists
- Decoration checklists

#### Mother's Day & Father's Day

- Special gift planning
- Event organization
- Card management
- Celebration tracking

#### Birthday & Anniversary

- Personal celebration planning
- Gift tracking
- Event organization
- Contact management

#### Graduation

- Academic celebration planning
- Gift management
- Event coordination
- Guest list organization

#### Baby Shower

- Gift registry management
- Guest list planning
- Event coordination
- Contact organization

#### New Year

- Resolution tracking
- Party planning
- Decoration management
- Event organization

#### Fourth of July

- Patriotic celebration planning
- Event organization
- Decoration management
- Task tracking

### 🎨 UI/UX Features

- **Gamified Mode**: Colorful, engaging interface with gradients and animations
- **Professional Mode**: Clean, business-like interface
- **Holiday-Specific Colors**: Each holiday has its own color scheme
- **Progress Indicators**: Visual progress bars and completion tracking
- **Toast Notifications**: User feedback for actions
- **Loading States**: Smooth loading animations
- **Error Handling**: Graceful error states and recovery

### ⚙️ Settings & Customization

- **Holiday Preferences**: Select which holidays to track
- **Budget Management**: Set individual budgets for each holiday
- **Notification Settings**: Configure reminder preferences
- **Theme Customization**: Dark/light mode and display mode
- **User Profile**: Edit name, email, and profile picture

## 🛠️ Technology Stack

### Frontend

- **Next.js 15.4.2**: React framework with App Router
- **React 19.1.0**: UI library
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first CSS framework
- **Redux Toolkit**: State management
- **Redux Persist**: Data persistence

### Authentication

- **Auth0**: OAuth authentication provider
- **@auth0/auth0-react**: React SDK for Auth0

### Development Tools

- **ESLint**: Code linting
- **Turbopack**: Fast development bundler
- **PostCSS**: CSS processing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd next-holiday
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   AUTH0_DOMAIN=your-auth0-domain
   AUTH0_CLIENT_ID=your-auth0-client-id
   AUTH0_CLIENT_SECRET=your-auth0-client-secret
   AUTH0_CALLBACK_URL=http://localhost:3000
   ```

4. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
next-holiday/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── [holiday]/          # Holiday-specific pages
│   │   │   ├── gift-list/      # Gift management
│   │   │   ├── tasks/          # Task management
│   │   │   ├── cards/          # Card management
│   │   │   ├── address-book/   # Contact management
│   │   │   └── page.tsx        # Holiday main page
│   │   ├── settings/           # User settings
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # Reusable components
│   │   ├── auth/               # Authentication components
│   │   ├── cards/              # Card components
│   │   ├── common/             # Shared components
│   │   ├── modals/             # Modal components
│   │   └── examples/           # Example components
│   ├── store/                  # Redux store
│   │   ├── slices/             # Redux slices
│   │   │   ├── [holiday]/      # Holiday-specific slices
│   │   │   └── index.ts        # Store configuration
│   │   ├── hooks.ts            # Redux hooks
│   │   └── provider.tsx        # Redux provider
│   ├── config/                 # Configuration files
│   ├── data/                   # Static data
│   └── utils/                  # Utility functions
├── public/                     # Static assets
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## 🎯 Key Features in Detail

### Holiday Management

Each holiday has its own dedicated section with:

- **Main Dashboard**: Overview of all holiday activities
- **Gift Lists**: Track gifts, recipients, and budgets
- **Task Management**: Organize preparation tasks
- **Card Management**: Handle greeting cards
- **Address Book**: Manage contacts and addresses
- **Progress Tracking**: Visual completion indicators

### Data Management

- **Redux State**: Centralized state management
- **Local Storage**: Data persistence across sessions
- **Real-time Updates**: Immediate UI updates
- **Error Handling**: Graceful error recovery

### User Experience

- **Responsive Design**: Works on all device sizes
- **Accessibility**: Keyboard navigation and screen reader support
- **Performance**: Optimized loading and rendering
- **Offline Support**: Basic functionality without internet

## 🔧 Configuration

### Auth0 Setup

1. Create an Auth0 application
2. Configure callback URLs
3. Set up social login providers (optional)
4. Add environment variables

### Customization

- **Holiday Colors**: Modify color schemes in `holidayData.ts`
- **Form Fields**: Customize forms in `formConfigs.ts`
- **Validation**: Update validation rules in `formValidation.ts`
- **Styling**: Modify Tailwind classes and CSS variables

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Configure environment variables
3. Deploy automatically on push

### Other Platforms

- **Netlify**: Similar to Vercel deployment
- **AWS Amplify**: Full-stack deployment
- **Docker**: Containerized deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review the code comments

## 🎉 Acknowledgments

- Built with Next.js and React
- Styled with Tailwind CSS
- State management with Redux Toolkit
- Authentication powered by Auth0
- Icons and assets from various sources

---

**Next Holiday** - Making holiday planning fun and organized! 🎄✨

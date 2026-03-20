# Next Holiday 🎄

A comprehensive, database-backed holiday planning platform built with Next.js, MySQL, and modern web technologies. Create, organize, and collaborate on holiday celebrations with your family and friends through a beautiful, multi-tenant architecture.

## 🌟 Overview

Next Holiday is a full-stack holiday planning application that transforms the chaos of holiday preparation into an organized, collaborative experience. Built on a robust MySQL database with Prisma ORM, the platform supports multi-user collaboration through a sophisticated account and sharing system.

### Key Capabilities

- **Multi-Tenant Architecture**: Account-based organization for families and households
- **Database-Backed Persistence**: MySQL database with 18+ tables for reliable data storage
- **Real-Time Collaboration**: Share holidays with family members and friends
- **15+ Holiday Types**: Comprehensive support from Christmas to Baby Showers
- **Professional & Gamified UI**: Toggle between business-like and colorful interfaces
- **Progressive Web App**: Works seamlessly across desktop, tablet, and mobile

## 🚀 Features

### 🏠 Multi-Tenant Account System

- **Household Accounts**: Create family or friend group accounts for shared planning
- **Member Management**: Add users to accounts with role-based permissions
- **Account Ownership**: Primary account owners can manage members and settings
- **Data Isolation**: Secure multi-tenant data separation with row-level security

### 🤝 Holiday Sharing & Collaboration

- **Share Holidays**: Share specific holidays with other users for collaborative planning
- **Invitation System**: Send invitations via email with status tracking
- **Member Roles**: Manage who can edit, view, and invite others to shared holidays
- **Real-Time Updates**: Changes sync across all collaborative members instantly

### 🎁 Comprehensive Holiday Planning

#### Supported Holidays

- **Traditional**: Christmas, Easter, Thanksgiving, Halloween, New Year
- **Cultural**: Hanukkah, Kwanzaa
- **Personal**: Birthday, Anniversary, Graduation, Baby Shower
- **Seasonal**: Valentine's Day, Mother's Day, Father's Day, Fourth of July

#### Planning Features

- **Gift Lists**: Track recipients, budgets, stores, and purchase status
- **Task Management**: Organize preparation tasks with priorities and due dates
- **Card Management**: Manage greeting cards with addresses and messages
- **Budget Tracking**: Set budgets and track spending with detailed transactions
- **Contact Integration**: Address book with full contact management
- **Progress Tracking**: Visual completion indicators for all activities

### 🔐 Authentication & Security

- **Auth0 Integration**: Secure OAuth authentication with social login support
- **User Sync**: Automatic user creation and profile management
- **Session Management**: Secure session handling with automatic token refresh
- **Multi-Factor Authentication**: Support for MFA through Auth0
- **Data Encryption**: SSL/TLS for data in transit, encrypted storage at rest

### 🎨 User Experience

- **Display Modes**: Toggle between Professional and Gamified interfaces
- **Theme Support**: Full dark/light theme with smooth transitions
- **Holiday Themes**: Each holiday has custom color schemes and styling
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: Keyboard navigation and screen reader support
- **Loading States**: Smooth animations and progress indicators

### 📊 Advanced Features

- **Subscription Management**: Free and premium tiers with payment processing
- **User Preferences**: Comprehensive settings for notifications, themes, and behavior
- **Audit Logging**: Track user actions for debugging and compliance
- **Data Export**: Export holiday data for backup or migration
- **Search & Filtering**: Advanced filtering and sorting across all data types

## 🛠️ Technology Stack

### Frontend

- **Next.js 15.4.2**: React framework with App Router architecture
- **React 19.1.0**: Latest React with concurrent features
- **TypeScript**: Type-safe development with strict mode
- **Tailwind CSS 3.4.0**: Utility-first CSS framework with custom configurations
- **Redux Toolkit 2.8.2**: State management with RTK Query for API calls
- **Redux Persist**: Client-side state persistence for user preferences

### Backend & Database

- **MySQL**: Production-grade relational database
- **Prisma ORM 6.14.0**: Type-safe database access with migrations
- **18+ Database Tables**: Comprehensive schema for multi-tenant holiday planning
- **UUID Primary Keys**: Distributed-system-friendly unique identifiers
- **Foreign Key Constraints**: Data integrity with cascade delete rules

### Authentication

- **Auth0 2.4.0**: Enterprise OAuth provider with social login
- **JWT Tokens**: Secure authentication with automatic refresh
- **User Management**: Profile sync and automatic account creation
- **Multi-Factor Authentication**: Optional MFA for enhanced security

### Development & Testing

- **Jest**: Testing framework with comprehensive test coverage
- **Testing Library**: Component and integration testing utilities
- **ESLint**: Code linting with Next.js and TypeScript rules
- **TypeScript**: Strict type checking across frontend and backend
- **Turbopack**: Fast development bundler for rapid iteration

### Deployment & Infrastructure

- **AWS Amplify**: Serverless deployment with CI/CD pipeline
- **SSL/TLS**: HTTPS encryption for all data in transit
- **Environment Management**: Separate dev, staging, and production environments
- **Database Hosting**: Managed MySQL with automated backups

## 📁 Project Structure

```
next-holiday/
├── prisma/                     # Database schema and migrations
│   ├── schema.prisma          # Prisma schema definition
│   └── migrations/            # Database migration files
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── api/               # REST API endpoints (50+ routes)
│   │   │   ├── users/         # User management APIs
│   │   │   ├── accounts/      # Account and member management
│   │   │   ├── holidays/      # Holiday CRUD operations
│   │   │   ├── shares/        # Holiday sharing APIs
│   │   │   ├── invites/       # Invitation management
│   │   │   └── payment/       # Subscription processing
│   │   ├── christmas/         # Holiday-specific pages
│   │   ├── hanukkah/
│   │   ├── birthday/
│   │   ├── [holiday]/         # Dynamic holiday routes
│   │   ├── settings/          # User settings and preferences
│   │   ├── address-book/      # Contact management
│   │   └── page.tsx           # Home page with holiday selection
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   ├── cards/             # Card UI components
│   │   ├── common/            # Shared components
│   │   ├── modals/            # Modal dialogs
│   │   └── animations/        # Animation components
│   ├── store/                 # Redux store and slices
│   │   ├── api.ts             # RTK Query API definitions
│   │   ├── slices/            # Redux slices for state management
│   │   └── index.ts           # Store configuration
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts            # Auth0 configuration
│   │   ├── prisma.ts          # Database client setup
│   │   └── server/            # Server-side utilities
│   ├── hooks/                 # Custom React hooks (25+ hooks)
│   ├── config/                # Configuration files
│   ├── data/                  # Static data and type definitions
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Helper functions
├── docs/                      # Documentation
│   ├── db/                    # Database documentation
│   └── holidays/              # Holiday-specific docs
├── scripts/                   # Utility scripts
├── db/                        # Database schema files
├── amplify.yml                # AWS Amplify deployment config
├── jest.config.js             # Testing configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── next.config.ts             # Next.js configuration
└── package.json               # Dependencies and scripts
```

## 🗄️ Database Architecture

### Schema Overview

The MySQL database consists of 18+ interconnected tables designed for multi-tenant holiday planning:

**📊 [View Live ERD Diagram](https://mermaid.ai/app/projects/5a13959b-bcd3-4844-834d-1f664ae6f043/diagrams/3605b52a-9a41-4a09-a764-2c6ee2d62a92/version/v0.1/edit)** - Interactive database schema visualization

#### Core Tables

- **users**: Auth0 user profiles and authentication data
- **accounts**: Multi-tenant households/families for collaboration
- **account_members**: Many-to-many relationship between users and accounts
- **user_preferences**: Individual user settings and preferences

#### Holiday Management

- **holidays**: Holiday instances with metadata and configuration
- **tasks**: Generic and holiday-specific tasks with priorities
- **task_assignees**: Multi-user task assignment support
- **gifts**: Gift lists with recipients, budgets, and purchase tracking
- **cards**: Greeting cards with addresses and sending status
- **budgets**: Budget tracking with spending limits
- **budget_transactions**: Detailed expense tracking

#### Collaboration System

- **shares**: Holiday sharing for multi-user collaboration
- **share_members**: Many-to-many relationship for share membership
- **invites**: Invitation system with status tracking and email notifications

#### Contact Management

- **contacts**: Address book entries for recipients and addresses
- **guest_lists**: Event guest lists with RSVP tracking

#### Specialized Tables

- **kwanzaa_principles**: Daily principle tracking for Kwanzaa celebrations
- **audit_log**: System activity tracking for debugging and compliance

### Key Relationships

- Users belong to multiple accounts through account_members
- Accounts own multiple holidays with full lifecycle management
- Holidays can be shared with other users through the sharing system
- All planning data (tasks, gifts, cards) is scoped to accounts for data isolation
- Contacts can be linked to gifts, cards, and guest lists across holidays

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**: Latest LTS version recommended
- **MySQL 8.0+**: Database server (local or cloud-hosted)
- **Auth0 Account**: For authentication services
- **npm/yarn/pnpm**: Package manager

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

   Create a `.env.local` file:

   ```env
   # Database Configuration
   DATABASE_URL="mysql://username:password@localhost:3306/next_holiday"

   # Auth0 Configuration
   AUTH0_SECRET="your-auth0-secret-key"
   AUTH0_BASE_URL="http://localhost:3000"
   AUTH0_ISSUER_BASE_URL="https://your-domain.auth0.com"
   AUTH0_CLIENT_ID="your-auth0-client-id"
   AUTH0_CLIENT_SECRET="your-auth0-client-secret"

   # Optional: Payment Processing (Test Mode)
   PAYMENT_TEST_MODE="true"

   # Optional: Feature Flags
   DELETE_HOLIDAY_CASCADE_ENABLED="false"
   DELETE_HOLIDAY_ROW_THRESHOLD="1000"
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev --name init

   # Optional: Seed the database
   npx prisma db seed
   ```

5. **Configure Auth0**

   In your Auth0 dashboard:
   - Set Callback URLs: `http://localhost:3000/api/auth/callback/auth0`
   - Set Logout URLs: `http://localhost:3000`
   - Enable social login providers (optional)
   - Configure user profile settings

6. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

7. **Access the application**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Database Management

```bash
# View database schema
npx prisma studio

# Reset database (development only)
npx prisma migrate reset

# Deploy to production
npx prisma migrate deploy

# Generate new migration
npx prisma migrate dev --name feature_name
```

### Development Scripts

```bash
# Development with Turbopack
npm run dev:turbo

# Testing
npm run test                    # Run all tests
npm run test:watch             # Watch mode
npm run test:coverage          # Generate coverage report

# Database operations
npm run db:migrate             # Run migrations
npm run db:reset              # Reset database (dev only)
npm run db:studio             # Open Prisma Studio
npm run db:seed               # Seed database

# Build and deployment
npm run build                 # Production build
npm run start                 # Start production server
npm run lint                  # Run ESLint
npm run type-check           # TypeScript checks
```

## 🧪 Testing

### Test Suite Overview

- **Jest**: Primary testing framework with React Testing Library
- **Coverage**: Comprehensive test coverage across components and API routes
- **Test Types**: Unit tests, integration tests, and API endpoint tests
- **Mock Data**: Realistic test fixtures and database mocking

### Running Tests

```bash
# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Test specific files
npm run test -- --testPathPattern=components
```

### Test Structure

```
src/
├── __tests__/
│   ├── api/                   # API endpoint tests
│   ├── auth/                  # Authentication tests
│   ├── components/            # Component tests
│   ├── routes/                # Page route tests
│   ├── server/                # Server-side tests
│   └── store/                 # Redux store tests
```

## 🚀 Deployment

### AWS Amplify Deployment

The application is configured for AWS Amplify with the provided `amplify.yml`:

1. **Connect Repository**: Link your GitHub repository to AWS Amplify
2. **Environment Variables**: Configure production environment variables
3. **Database Setup**: Set up managed MySQL instance (RDS/Aurora)
4. **Domain Configuration**: Configure custom domain and SSL certificates
5. **Deploy**: Automatic deployment on push to main branch

### Environment Configuration

**Production Environment Variables:**

```env
DATABASE_URL="mysql://user:password@production-host:3306/next_holiday"
AUTH0_SECRET="production-secret-key"
AUTH0_BASE_URL="https://yourdomain.com"
# ... other production configs
```

### Database Deployment

```bash
# Deploy migrations to production
npx prisma migrate deploy

# Verify deployment
npx prisma migrate status
```

### Performance Considerations

- **Database Indexing**: Optimized indexes for multi-tenant queries
- **Connection Pooling**: Prisma connection pooling for scalability
- **Caching**: Redis caching for frequently accessed data (optional)
- **CDN**: Static asset delivery through AWS CloudFront

## 🤝 Collaboration Features

### Holiday Sharing System

1. **Create Share**: Holiday owners can create shareable links
2. **Send Invitations**: Invite users via email with custom messages
3. **Accept/Decline**: Recipients can accept or decline invitations
4. **Member Management**: Add/remove members from shared holidays
5. **Permission Control**: Role-based access to editing and inviting

### Multi-User Planning

- **Collaborative Editing**: Multiple users can edit tasks, gifts, and cards
- **Task Assignment**: Assign tasks to specific team members
- **Real-Time Updates**: Changes sync across all connected users
- **Activity Tracking**: Audit log shows who made what changes
- **Conflict Resolution**: Optimistic updates with conflict handling

### Account Management

- **Household Accounts**: Create accounts for families or friend groups
- **Member Roles**: Owner, Admin, and Member permission levels
- **Invitation System**: Invite users to join your account
- **Data Sharing**: Share contacts, budgets, and preferences within accounts

## 🔧 Configuration & Customization

### Holiday Configuration

Customize holidays in `src/data/holidayData.ts`:

```typescript
export const holidayData = {
  christmas: {
    name: 'Christmas',
    colors: { light: '#dc2626', dark: '#ef4444' },
    // ... other configurations
  },
  // ... other holidays
};
```

### Form Customization

Modify form fields in `src/config/formConfigs.ts`:

```typescript
export const giftsFormConfig: FormConfig = {
  title: 'Add New Gift',
  fields: [
    { id: 'recipient', type: 'text', placeholder: 'Recipient*', required: true },
    // ... other fields
  ],
};
```

### Theme Customization

Update Tailwind configuration in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Custom color schemes
      },
    },
  },
};
```

### User Preferences

Default preferences are configured in `src/lib/constants/userPreferences.ts`:

```typescript
export const DEFAULT_USER_PREFERENCES = {
  theme: 'light',
  displayMode: 'professional',
  emailNotifications: false,
  // ... other defaults
};
```

## 📚 API Documentation

### REST API Endpoints

The application provides 50+ REST API endpoints organized by feature:

#### User Management

- `GET /api/users/me` - Get current user profile
- `POST /api/users` - Create/update user profile
- `PUT /api/users/preferences` - Update user preferences

#### Account Management

- `GET /api/accounts` - List user accounts
- `POST /api/accounts` - Create new account
- `POST /api/accounts/:id/members` - Add account member

#### Holiday Management

- `GET /api/holidays` - List holidays for account
- `POST /api/holidays` - Create new holiday
- `PUT /api/holidays/:id` - Update holiday
- `DELETE /api/holidays/:id` - Delete holiday (with cascade)

#### Task Management

- `GET /api/holidays/:id/tasks` - Get holiday tasks
- `POST /api/holidays/:id/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

#### Gift Management

- `GET /api/holidays/:id/gifts` - Get holiday gifts
- `POST /api/holidays/:id/gifts` - Create gift
- `PUT /api/gifts/:id` - Update gift
- `DELETE /api/gifts/:id` - Delete gift

#### Sharing & Collaboration

- `POST /api/holidays/:id/share` - Create holiday share
- `GET /api/shares/:id` - Get share details
- `POST /api/shares/:id/invites` - Send invitation
- `POST /api/invites/:id/accept` - Accept invitation
- `POST /api/invites/:id/decline` - Decline invitation

#### Contact Management

- `GET /api/contacts` - List account contacts
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### API Authentication

All API calls require authentication via Auth0 JWT tokens:

```typescript
// Example API call with authentication
const response = await fetch('/api/holidays', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
});
```

## 🔒 Security & Privacy

### Data Security

- **Encryption**: All data encrypted in transit and at rest
- **Authentication**: Secure OAuth 2.0 with Auth0
- **Authorization**: Row-level security for multi-tenant data isolation
- **Input Validation**: Comprehensive validation on all API endpoints
- **SQL Injection Prevention**: Parameterized queries through Prisma ORM

### Privacy Features

- **Data Ownership**: Users own their data within account boundaries
- **Data Portability**: Export functionality for user data
- **Account Deletion**: Complete data removal on account deletion
- **Access Logs**: Audit trail for data access and modifications
- **GDPR Compliance**: Privacy controls and data subject rights

### Multi-Tenant Security

- **Account Isolation**: Strict data separation between accounts
- **Permission Checking**: Authorization checks on all data access
- **Share Validation**: Secure sharing with proper permission validation
- **Invite Security**: Secure invitation tokens with expiration

## 🚨 Troubleshooting

### Common Issues

**Database Connection Errors**

```bash
# Check database connection
npx prisma db pull

# Reset database in development
npx prisma migrate reset
```

**Auth0 Configuration Issues**

- Verify callback URLs match exactly
- Check environment variables are set correctly
- Ensure Auth0 application type is set to "Single Page Application"

**Build Errors**

```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npx prisma generate

# Type check
npm run type-check
```

**Performance Issues**

- Check database query performance in Prisma Studio
- Monitor Redux DevTools for unnecessary re-renders
- Use React Profiler for component performance analysis

### Debug Mode

Enable debug logging:

```env
# Enable Prisma query logging
DEBUG="prisma:query"

# Enable Next.js debug mode
DEBUG="next:*"
```

### Support Resources

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Comprehensive docs in `/docs` folder
- **Database Schema**: Visual ERD in `docs/db/erd.md`
- **Migration Notes**: Database migration guide in `docs/db/migration-notes.md`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team**: For the excellent React framework
- **Prisma Team**: For the outstanding ORM and database tools
- **Auth0**: For secure authentication services
- **Tailwind CSS**: For the utility-first CSS framework
- **Redux Toolkit**: For efficient state management
- **AWS Amplify**: For seamless deployment and hosting

---

**Next Holiday** - Bringing families and friends together through organized, collaborative holiday planning! 🎄✨

_Built with ❤️ using Next.js, MySQL, Prisma, and Auth0_

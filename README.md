# Next Holiday

A comprehensive, enterprise-grade holiday planning platform built with Next.js, MySQL, Prisma, and modern web technologies. Create, organize, and collaborate on holiday celebrations with your family and friends through a beautiful, multi-tenant architecture with real-time notifications.

## Overview

Next Holiday is a production-ready, full-stack holiday planning application that transforms the chaos of holiday preparation into an organized, collaborative experience. Built on a robust MySQL database with Prisma ORM, the platform features a sophisticated multi-tenant architecture, real-time Server-Sent Events (SSE) notifications, and comprehensive account and sharing system.

### Key Capabilities

- **Multi-Tenant Architecture**: Account-based organization with row-level security for families and households
- **Database-Backed Persistence**: MySQL database with 18+ interconnected tables for reliable data storage
- **Real-Time Notifications**: Microservice-based SSE notifications for instant updates across all devices
- **Multi-User Collaboration**: Share holidays with family members and friends with role-based permissions
- **15+ Holiday Types**: Comprehensive support from Christmas to Baby Showers, Anniversary to Kwanzaa
- **Professional & Gamified UI**: Toggle between business-like and colorful themed interfaces
- **Progressive Web App**: Responsive design works seamlessly across desktop, tablet, and mobile
- **Production-Ready**: Deployed on AWS Amplify with enterprise security and scalability

## 🚀 Features

### 🔔 Real-Time Notification System

**Microservice Architecture with SSE (Server-Sent Events)**

The notification system is powered by a separate microservice hosted on its own EC2 instance, providing scalable and reliable real-time updates:

- **Dedicated SSE Service**: Hosted as an independent microservice for optimal performance and scalability
- **Live Updates**: Instant notifications for task assignments, completions, and holiday invitations
- **Multi-Tab Support**: Notifications sync across multiple browser tabs and devices
- **Automatic Fallback**: Graceful degradation to polling if SSE is unavailable
- **Browser Notifications**: Native desktop notifications with user permission
- **Connection Management**: Automatic reconnection with heartbeat monitoring
- **Zero Impact on Main App**: Isolated architecture ensures notification failures never affect core functionality

**🔗 SSE Microservice Repository**: [sse-notifications](https://github.com/Lanny-MacMillan/sse-notifications)

The SSE service handles:

- Real-time notification delivery via Server-Sent Events
- Database persistence of notification history
- Multi-user broadcast capabilities
- Connection state management
- Heartbeat and health monitoring

### 🏠 Multi-Tenant Account System

- **Household Accounts**: Create family or friend group accounts for shared planning
- **Member Management**: Add users to accounts with role-based permissions
- **Account Ownership**: Primary account owners can manage members and settings
- **Data Isolation**: Secure multi-tenant data separation with row-level security
- **Account Switching**: Users can belong to multiple accounts and switch between them

### 🤝 Holiday Sharing & Collaboration

- **Share Holidays**: Share specific holidays with other users for collaborative planning
- **Invitation System**: Send invitations via email with real-time status tracking
- **Member Roles**: Manage who can edit, view, and invite others to shared holidays
- **Real-Time Updates**: Changes sync across all collaborative members instantly via SSE
- **Assignment Notifications**: Get notified when tasks, gifts, or cards are assigned to you
- **Completion Tracking**: Automatic notifications when assigned items are completed

### 🎁 Comprehensive Holiday Planning

#### Supported Holidays (15+)

- **Winter Holidays**: Christmas, Hanukkah, Kwanzaa, New Year
- **Spring Holidays**: Easter, Mother's Day, Father's Day, Graduation
- **Summer Holidays**: Fourth of July
- **Fall Holidays**: Halloween, Thanksgiving
- **Year-Round**: Birthday, Anniversary, Valentine's Day, Baby Shower

#### Planning Features

**Gift Management**

- Track recipients, budgets, stores, and purchase status
- Assign gifts to specific family members or friends
- Mark gifts as purchased, wrapped, or delivered
- Budget tracking with spending limits and alerts
- Link contacts from address book for easy recipient selection

**Task Management**

- Organize preparation tasks with priorities (low, medium, high)
- Set due dates and completion tracking
- Assign tasks to specific users with real-time notifications
- Task categories specific to each holiday type
- Progress indicators and completion statistics

**Card Management**

- Manage greeting cards with addresses and messages
- Track card sending status (unsent, sent, delivered)
- Integration with contact address book
- Assign card writing and sending to team members
- Message templates and personalization

**Budget Tracking**

- Set overall holiday budgets with spending limits
- Track detailed transactions across gifts, decorations, and activities
- Real-time budget vs. actual spending comparisons
- Category-based expense tracking
- Export budget reports for tax or record-keeping

**Contact Integration**

- Comprehensive address book with full contact management
- Store names, addresses, phone numbers, emails, and notes
- Link contacts to gifts, cards, and guest lists
- Quick contact selection across all holiday features
- Import/export contact data

**Progress Tracking**

- Visual completion indicators for all activities
- Category-based progress bars (tasks, gifts, cards)
- Real-time updates across all collaborative users
- Countdown timers to holiday dates
- Completion percentage tracking

### 🔐 Authentication & Security

- **Auth0 Integration**: Secure OAuth authentication with social login support
- **User Sync**: Automatic user creation and profile management
- **Session Management**: Secure session handling with automatic token refresh
- **Multi-Factor Authentication**: Support for MFA through Auth0
- **Data Encryption**: SSL/TLS for data in transit, encrypted storage at rest

### 🎨 User Experience

- **Display Modes**: Toggle between Professional (business-like) and Gamified (colorful, themed) interfaces
- **Theme Support**: Full dark/light theme with smooth transitions and system preference detection
- **Holiday Themes**: Each holiday has custom color schemes, gradients, and styling
- **Responsive Design**: Optimized layouts for desktop (1920px+), tablet (768px+), and mobile (320px+)
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- **Loading States**: Smooth animations, skeleton screens, and progress indicators
- **Countdown Timers**: Real-time countdowns to upcoming holidays on homepage and holiday pages
- **Interactive Cards**: Hover effects, animations, and visual feedback throughout the interface
- **Notification Center**: In-app notification center with real-time updates and history

### 📊 Advanced Features

- **User Preferences**: Comprehensive settings for notifications, themes, display modes, and behavior
- **Notification Preferences**: Granular control over assignment, completion, and invite notifications
- **Audit Logging**: Track user actions for debugging, compliance, and activity history
- **Search & Filtering**: Advanced filtering and sorting across all data types
- **Holiday-Specific Features**:
  - **Christmas**: Gift lists, card management, decoration tracking
  - **Hanukkah**: 8-night candle lighting ceremony tracking
  - **Kwanzaa**: 7 principles (Nguzo Saba) tracking with daily reflections
  - **Baby Shower**: Games and activities management
  - **Fourth of July**: Events and activities planning
  - **Graduation**: Task and milestone tracking
  - And more specialized features for each holiday type
- **Data Validation**: Client and server-side validation with Zod schemas
- **Error Handling**: Graceful error handling with user-friendly messages
- **Optimistic Updates**: Instant UI updates with automatic rollback on failure

## 🛠️ Technology Stack

### Frontend

- **Next.js 15.4.2**: React framework with App Router architecture and server components
- **React 19.1.0**: Latest React with concurrent features and improved performance
- **TypeScript 5+**: Type-safe development with strict mode enabled
- **Tailwind CSS 3.4.0**: Utility-first CSS framework with custom configurations and dark mode
- **Redux Toolkit 2.8.2**: State management with RTK Query for efficient API calls and caching
- **Redux Persist 6.0.0**: Client-side state persistence for user preferences and session data

### Backend & Database

- **MySQL 8.0+**: Production-grade relational database with ACID compliance
- **Prisma ORM 6.14.0**: Type-safe database access with migrations and schema management
- **18+ Database Tables**: Comprehensive schema for multi-tenant holiday planning
- **UUID Primary Keys**: Distributed-system-friendly unique identifiers
- **Foreign Key Constraints**: Referential integrity with cascade delete rules
- **Database Migrations**: Version-controlled schema changes with rollback support

### Authentication & Security

- **Auth0 3.5.0**: Enterprise OAuth provider with social login support
- **JWT Tokens**: Secure authentication with automatic refresh and token validation
- **User Management**: Automated profile sync and account creation
- **Session Handling**: Secure session management with httpOnly cookies
- **Multi-Factor Authentication**: Optional MFA through Auth0 for enhanced security

### Real-Time Infrastructure

- **SSE Microservice**: Dedicated Node.js/Express server for real-time notifications
- **Separate EC2 Instance**: Isolated infrastructure for notification delivery
- **EventSource API**: Browser-native SSE connection management
- **Polling Fallback**: Automatic fallback for environments without SSE support
- **Connection Management**: Automatic reconnection and heartbeat monitoring

**🔗 SSE Service Repository**: [https://github.com/Lanny-MacMillan/sse-notifications](https://github.com/Lanny-MacMillan/sse-notifications)

### Development & Testing

- **Jest 29.7.0**: Testing framework with comprehensive test coverage
- **React Testing Library**: Component and integration testing utilities
- **ESLint 9**: Code linting with Next.js and TypeScript rules
- **Prettier 3.8.1**: Code formatting with consistent style
- **TypeScript Strict Mode**: Full type checking across frontend and backend
- **Turbopack**: Fast development bundler for rapid iteration (Next.js 15+)
- **Test Suites**: 100+ tests covering components, API routes, and business logic

### Deployment & Infrastructure

- **AWS Amplify**: Serverless deployment with CI/CD pipeline and automatic builds
- **SSL/TLS**: HTTPS encryption for all data in transit
- **Environment Management**: Separate dev, staging, and production environments
- **Database Hosting**: Managed MySQL with automated backups and point-in-time recovery
- **EC2 Instance**: Dedicated virtual machine for SSE notification microservice
- **AWS CloudWatch**: Monitoring, logging, and alerting for production infrastructure
- **Route 53**: DNS management and custom domain configuration

## 🗄️ Database Architecture

### Schema Overview

The MySQL database consists of 18+ interconnected tables designed for multi-tenant holiday planning with a focus on data integrity, security, and scalability:

**📊 [View Live ERD Diagram](https://mermaid.ai/app/projects/5a13959b-bcd3-4844-834d-1f664ae6f043/diagrams/3605b52a-9a41-4a09-a764-2c6ee2d62a92/version/v0.1/edit)** - Interactive database schema visualization

#### Core Tables

- **users**: Auth0 user profiles, authentication data, and subscription information
- **accounts**: Multi-tenant households/families for collaboration
- **account_members**: Many-to-many relationship between users and accounts with role management
- **user_preferences**: Individual user settings including theme, display mode, and notification preferences
- **notification_preferences**: Granular notification settings per user

#### Holiday Management

- **holidays**: Holiday instances with metadata, dates, and configuration
- **tasks**: Generic and holiday-specific tasks with priorities, due dates, and assignments
- **task_assignees**: Multi-user task assignment support for collaborative planning
- **gifts**: Gift lists with recipients, budgets, stores, and purchase tracking
- **cards**: Greeting cards with addresses, messages, and sending status
- **budgets**: Budget tracking with spending limits and category organization
- **budget_transactions**: Detailed expense tracking with timestamps and descriptions

#### Collaboration System

- **shares**: Holiday sharing configuration for multi-user collaboration
- **share_members**: Many-to-many relationship for share membership with role-based permissions
- **invites**: Invitation system with status tracking (pending, accepted, declined) and email notifications
- **notifications**: Real-time notification history with read/dismissed status

#### Contact Management

- **contacts**: Address book entries with full contact information (name, address, phone, email)
- **guest_lists**: Event guest lists with RSVP tracking and meal preferences

#### Specialized Tables

- **kwanzaa_principles**: Daily principle tracking for Kwanzaa celebrations (7 days of Nguzo Saba)
- **hanukkah_candles**: Candle lighting ceremony tracking for 8 nights
- **baby_shower_games**: Games and activities management for baby showers
- **audit_log**: System activity tracking for debugging, compliance, and user activity history

### Key Relationships

- Users can belong to multiple accounts through `account_members` (many-to-many)
- Accounts own multiple holidays with full lifecycle management
- Holidays can be shared with other users through the `shares` and `share_members` system
- All planning data (tasks, gifts, cards) is scoped to accounts for strict data isolation
- Contacts can be linked to gifts, cards, and guest lists across holidays
- Tasks support multi-user assignment through `task_assignees`
- Notifications track all user interactions and system events
- Foreign key constraints ensure referential integrity with cascade delete rules

### Data Isolation & Security

- **Row-Level Security**: All queries filtered by account ownership
- **Multi-Tenant Architecture**: Complete data separation between accounts
- **UUID Primary Keys**: Globally unique identifiers prevent enumeration attacks
- **Cascade Deletes**: Proper cleanup when holidays or accounts are deleted
- **Indexed Queries**: Optimized indexes for fast multi-tenant queries

### Performance Optimization

- **Database Indexing**: Optimized indexes for multi-tenant queries on `accountId` and `userId`
- **Connection Pooling**: Prisma connection pooling configured for 20-50 connections
- **CDN**: Static assets cached and served through AWS CloudFront
- **Image Optimization**: Next.js Image component with automatic optimization
- **Code Splitting**: Automatic route-based code splitting with Next.js
- **SSR & SSG**: Server-side rendering for dynamic content, static generation where appropriate

### Monitoring & Logging

- **AWS CloudWatch**: Application logs, metrics, and alarms
- **Prisma Query Logging**: Database query performance monitoring (dev mode)
- **Error Tracking**: Console-based error logging (integrate Sentry for production)
- **Performance Metrics**: Next.js analytics and Core Web Vitals tracking

## 🤝 Collaboration Features

### Real-Time Notification System

- **Assignment Notifications**: Get notified instantly when tasks, gifts, or cards are assigned to you
- **Completion Notifications**: Receive updates when assigned items are completed by others
- **Invite Notifications**: Real-time alerts for holiday sharing invitations
- **Multi-Device Support**: Notifications sync across all devices and browser tabs
- **Browser Notifications**: Native desktop notifications (with permission)
- **Notification Center**: In-app notification center with history and read/unread status
- **SSE Connection**: Persistent connection for instant delivery via microservice

**SSE Microservice Repository**: [https://github.com/Lanny-MacMillan/sse-notifications](https://github.com/Lanny-MacMillan/sse-notifications)

### Holiday Sharing System

1. **Create Share**: Holiday owners can create shareable holiday access
2. **Send Invitations**: Invite users via email with custom messages and role selection
3. **Accept/Decline**: Recipients receive real-time notifications and can accept or decline
4. **Member Management**: Add/remove members from shared holidays at any time
5. **Permission Control**: Role-based access (viewer, editor, admin) for different responsibilities
6. **Share History**: Track all sharing activity and invitation status

### Multi-User Planning

- **Collaborative Editing**: Multiple users can simultaneously edit tasks, gifts, and cards
- **Task Assignment**: Assign specific tasks to team members with automatic notifications
- **Real-Time Updates**: Changes propagate to all users instantly via SSE
- **Assignment Tracking**: See who's assigned to what across all holiday planning items
- **Activity Visibility**: All members see real-time progress on shared holidays
- **Conflict Prevention**: Optimistic updates with automatic synchronization

### Account Management

- **Household Accounts**: Create accounts representing families or friend groups
- **Member Roles**: Owner, Admin, and Member permission levels with different capabilities
- **Invitation System**: Invite users to join your account via email
- **Data Sharing**: Share contacts, budgets, and preferences within account context
- **Account Switching**: Seamlessly switch between multiple accounts you belong to
- **Member Administration**: Account owners can manage members and their roles

## 📚 API Documentation

### REST API Endpoints

The application provides 50+ REST API endpoints organized by feature. All endpoints require Auth0 JWT authentication.

#### User Management

- `GET /api/users/me` - Get current user profile with subscription info
- `POST /api/users` - Create or update user profile (auto-sync from Auth0)
- `PUT /api/users/preferences` - Update user preferences (theme, display mode, etc.)
- `GET /api/users/preferences` - Get user preferences

#### Notification Management

- `GET /api/notifications` - List user notifications (paginated, with filters)
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/:id/dismiss` - Dismiss notification
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `GET /api/notifications/stream` - SSE endpoint for real-time notifications

#### Account Management

- `GET /api/accounts` - List user accounts and memberships
- `POST /api/accounts` - Create new account (household/family)
- `PUT /api/accounts/:id` - Update account details
- `GET /api/accounts/:id/members` - List account members with roles
- `POST /api/accounts/:id/members` - Add account member with role
- `DELETE /api/accounts/:id/members/:userId` - Remove account member

#### Holiday Management

- `GET /api/holidays` - List holidays for user's current account
- `POST /api/holidays` - Create new holiday with initial configuration
- `GET /api/holidays/:id` - Get holiday details with all related data
- `PUT /api/holidays/:id` - Update holiday metadata and settings
- `DELETE /api/holidays/:id` - Delete holiday (with cascade delete of all data)

#### Task Management

- `GET /api/holidays/:id/tasks` - Get all tasks for a holiday
- `POST /api/holidays/:id/tasks` - Create new task with optional assignment
- `PUT /api/tasks/:id` - Update task details, status, or assignments
- `PATCH /api/tasks/:id/complete` - Toggle task completion status
- `DELETE /api/tasks/:id` - Delete task and assignments

#### Gift Management

- `GET /api/holidays/:id/gifts` - Get all gifts for a holiday
- `POST /api/holidays/:id/gifts` - Create new gift with budget tracking
- `PUT /api/gifts/:id` - Update gift details, purchase status, or budget
- `PATCH /api/gifts/:id/purchased` - Toggle gift purchased status
- `DELETE /api/gifts/:id` - Delete gift

#### Card Management

- `GET /api/holidays/:id/cards` - Get all cards for a holiday
- `POST /api/holidays/:id/cards` - Create new card with recipient info
- `PUT /api/cards/:id` - Update card details, message, or status
- `PATCH /api/cards/:id/sent` - Toggle card sent status
- `DELETE /api/cards/:id` - Delete card

#### Sharing & Collaboration

- `POST /api/holidays/:id/share` - Create holiday share configuration
- `GET /api/shares/:id` - Get share details and member list
- `PUT /api/shares/:id` - Update share settings and permissions
- `DELETE /api/shares/:id` - Remove share (all members lose access)
- `POST /api/shares/:id/invites` - Send invitation to user via email
- `GET /api/invites/:id` - Get invitation details
- `POST /api/invites/:id/accept` - Accept holiday invitation
- `POST /api/invites/:id/decline` - Decline holiday invitation
- `DELETE /api/shares/:shareId/members/:userId` - Remove member from share

#### Contact Management

- `GET /api/contacts` - List all contacts for account with search/filter
- `POST /api/contacts` - Create new contact with full details
- `PUT /api/contacts/:id` - Update contact information
- `DELETE /api/contacts/:id` - Delete contact (fails if linked to gifts/cards)

#### Budget Management

- `GET /api/holidays/:id/budgets` - Get budget and transactions for holiday
- `POST /api/holidays/:id/budgets` - Create budget with spending limit
- `PUT /api/budgets/:id` - Update budget limit or category
- `POST /api/budgets/:id/transactions` - Add expense transaction
- `DELETE /api/transactions/:id` - Delete transaction

### API Authentication

All API calls require authentication via Auth0 JWT tokens. The Next.js API routes handle token validation automatically.

```typescript
// Client-side API call example (automatic auth with next-auth)
const response = await fetch('/api/holidays', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});
const holidays = await response.json();
```

### API Response Format

All API responses follow a consistent format:

```typescript
// Success response
{
  data: { /* result object or array */ },
  message: "Optional success message"
}

// Error response
{
  error: "Error type",
  message: "Human-readable error message",
  details: { /* optional error details */ }
}
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
# Test database connection
npx prisma db pull

# Check if database exists
mysql -u username -p -e "SHOW DATABASES;"

# Reset database in development (⚠️ deletes all data)
npm run db:reset

# Verify Prisma client is generated
npm run db:generate
```

**Auth0 Configuration Issues**

- Verify **Allowed Callback URLs** match exactly: `http://localhost:3000/api/auth/callback`
- Check **Allowed Logout URLs**: `http://localhost:3000`
- Ensure **Allowed Web Origins**: `http://localhost:3000`
- Verify environment variables are set correctly in `.env.local`
- Check Auth0 application type is "Single Page Application"
- Ensure user profile includes name and picture fields

**SSE Notification Issues**

```bash
# Check if SSE service is running
curl http://localhost:4000/health

# Verify environment variables
echo $NEXT_PUBLIC_SSE_SERVICE_URL
echo $SSE_SERVICE_URL

# Check SSE service logs
# (In SSE service directory)
pm2 logs sse-service

# Test SSE connection manually
curl -N -H "Accept: text/event-stream" \
  "http://localhost:4000/stream?auth0Sub=auth0|test-user"
```

**Build Errors**

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npm run db:generate

# Type check
npx tsc --noEmit

# Check for linting errors
npm run lint
```

**Performance Issues**

- Check database query performance in Prisma Studio
- Monitor Redux DevTools for unnecessary re-renders
- Use React Profiler for component performance analysis
- Check network tab for slow API calls
- Verify database indexes are in place
- Consider connection pooling configuration

**Real-Time Notifications Not Working**

1. Verify SSE service is running and accessible
2. Check `NEXT_PUBLIC_SSE_SERVICE_URL` environment variable
3. Test EventSource connection in browser console
4. Check browser console for SSE connection errors
5. Verify Auth0 sub is being passed correctly
6. Check if fallback polling is being used (check notification center status)

### Debug Mode

Enable debug logging for troubleshooting:

```env
# Enable Prisma query logging
DEBUG="prisma:query"

# Enable Prisma engine logging
DEBUG="prisma:engine"

# Enable Next.js debug mode
DEBUG="next:*"

# Node.js debugging
NODE_OPTIONS='--inspect'
```

### Support Resources

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Comprehensive docs in `/docs` folder
- **Database Schema**: Visual ERD at [Mermaid.ai link](https://mermaid.ai/app/projects/5a13959b-bcd3-4844-834d-1f664ae6f043/diagrams/3605b52a-9a41-4a09-a764-2c6ee2d62a92/version/v0.1/edit)
- **SSE Service**: [sse-notifications repository](https://github.com/Lanny-MacMillan/sse-notifications)
- **Prisma Docs**: [https://www.prisma.io/docs](https://www.prisma.io/docs)
- **Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Auth0 Docs**: [https://auth0.com/docs](https://auth0.com/docs)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team**: For the exceptional React framework with App Router and server components
- **Prisma Team**: For the outstanding ORM, migrations, and database tools
- **Auth0**: For secure, enterprise-grade authentication services
- **Tailwind CSS**: For the utility-first CSS framework that powers the UI
- **Redux Toolkit**: For efficient state management and RTK Query
- **AWS**: For Amplify hosting, RDS database, and EC2 infrastructure
- **React Team**: For React 19 and continuous innovation
- **TypeScript Team**: For type safety and developer experience
- **Jest & Testing Library**: For comprehensive testing tools
- **Open Source Community**: For the countless libraries and tools that make this possible

## 🔗 Related Repositories

- **SSE Notifications Service**: [https://github.com/Lanny-MacMillan/sse-notifications](https://github.com/Lanny-MacMillan/sse-notifications)
  - Dedicated microservice for real-time Server-Sent Events notifications
  - Hosted on separate EC2 instance for optimal performance
  - Handles database persistence and broadcast delivery

## 🌟 Features Summary

✅ **15+ Holiday Types** with specialized planning features  
✅ **Real-Time Notifications** via dedicated SSE microservice  
✅ **Multi-Tenant Architecture** with row-level security  
✅ **Collaborative Planning** with task assignments and sharing  
✅ **Gift & Budget Tracking** with purchase status  
✅ **Card Management** with address book integration  
✅ **Dark/Light Themes** with professional and gamified modes  
✅ **Mobile Responsive** design for all devices  
✅ **Production Ready** deployed on AWS infrastructure  
✅ **Comprehensive Testing** with 100+ test suites  
✅ **Type Safe** with TypeScript throughout  
✅ **Well Documented** with inline comments and external docs

---

**Next Holiday** - Bringing families and friends together through organized, collaborative holiday planning! 🎄✨

_Built with ❤️ using Next.js 15, React 19, MySQL, Prisma, Auth0, and deployed on AWS_

**Live Demo**: [Coming Soon]  
**SSE Service**: [https://github.com/Lanny-MacMillan/sse-notifications](https://github.com/Lanny-MacMillan/sse-notifications)  
**Database ERD**: [View Interactive Diagram](https://mermaid.ai/app/projects/5a13959b-bcd3-4844-834d-1f664ae6f043/diagrams/3605b52a-9a41-4a09-a764-2c6ee2d62a92/version/v0.1/edit)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

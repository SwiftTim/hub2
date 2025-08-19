# 🎓 Academic Hub - University Collaboration & Assessment Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/elifamilytv-3968s-projects/v0-academichubfeatmajorfeatureexpa)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/8D7rioeuQZW)
[![React](https://img.shields.io/badge/React-18.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

## 📋 Overview

Academic Hub is a comprehensive full-stack university collaboration and assessment platform designed to revolutionize academic interactions between students and lecturers. The platform provides secure assessment environments, real-time communication, assignment management, and advanced analytics with enterprise-grade security features.

### 🌟 Key Features

- **🔐 Secure Authentication**: OAuth2/SAML SSO integration with university credentials
- **💬 Real-time Communication**: WhatsApp-style unit groups with Socket.io
- **📝 Secure Assessments**: Anti-cheat CAT system with comprehensive monitoring
- **📚 Assignment Management**: Complete submission and grading workflow
- **📖 Learning Resources**: Centralized resource hub with analytics
- **📊 Advanced Analytics**: Comprehensive reporting with digital watermarking
- **🔬 Research Tools**: Citation generator, plagiarism checker, and collaboration tools
- **📱 Mobile App**: Full-featured React Native companion app
- **🛡️ Digital Security**: Tamper-proof reports with cryptographic watermarking

## 🏗️ Architecture

### Frontend Stack
- **React.js 18** with TypeScript
- **Next.js 14** with App Router
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Socket.io Client** for real-time features

### Backend Stack
- **Express.js** REST API server
- **Node.js** runtime environment
- **Socket.io** for WebSocket communication
- **Passport.js** for authentication strategies
- **JWT** for secure token management

### Databases
- **PostgreSQL** (via Supabase) for academic data
- **MongoDB** for chat messages and real-time data
- **Redis** for session management and caching

### Mobile
- **React Native** with TypeScript
- **React Navigation** for routing
- **React Native Paper** for UI components
- **AsyncStorage** for local data persistence

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- MongoDB instance
- Redis server (optional, for production)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-username/academic-hub.git
   cd academic-hub
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   # Frontend dependencies
   npm install
   
   # Backend dependencies
   cd backend
   npm install
   cd ..
   
   # Mobile app dependencies (optional)
   cd mobile
   npm install
   cd ..
   \`\`\`

3. **Environment Configuration**
   
   Create `.env.local` in the root directory:
   \`\`\`env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:5000
   \`\`\`
   
   Create `backend/.env`:
   \`\`\`env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   
   # Database URLs
   POSTGRES_URL=your_postgres_connection_string
   MONGODB_URL=your_mongodb_connection_string
   
   # Authentication
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=24h
   JWT_REFRESH_SECRET=your_refresh_secret
   JWT_REFRESH_EXPIRE=7d
   
   # SSO Configuration
   SAML_ENTRY_POINT=your_university_saml_endpoint
   SAML_ISSUER=your_app_identifier
   SAML_CALLBACK_URL=http://localhost:5000/auth/saml/callback
   SAML_CERT=your_saml_certificate
   
   OAUTH2_CLIENT_ID=your_oauth2_client_id
   OAUTH2_CLIENT_SECRET=your_oauth2_client_secret
   OAUTH2_AUTHORIZATION_URL=your_oauth2_auth_url
   OAUTH2_TOKEN_URL=your_oauth2_token_url
   OAUTH2_CALLBACK_URL=http://localhost:5000/auth/oauth2/callback
   OAUTH2_USERINFO_URL=your_oauth2_userinfo_url
   
   # Security
   WATERMARK_SECRET=your_watermark_secret_key
   \`\`\`

4. **Database Setup**
   \`\`\`bash
   # Run PostgreSQL migrations
   npm run db:migrate
   
   # Setup MongoDB collections
   cd backend
   node scripts/mongodb-setup.js
   \`\`\`

5. **Start Development Servers**
   \`\`\`bash
   # Terminal 1: Start backend server
   cd backend
   npm run dev
   
   # Terminal 2: Start frontend server
   npm run dev
   
   # Terminal 3: Start mobile app (optional)
   cd mobile
   npm start
   \`\`\`

6. **Access the Application**
   - Web App: http://localhost:3000
   - API Server: http://localhost:5000
   - Mobile App: Use Expo Go app to scan QR code

## 📚 Features Documentation

### 🔐 Authentication System
- **SSO Integration**: Seamless login with university credentials
- **Role-based Access**: Student and lecturer role management
- **Session Management**: Secure JWT token handling with refresh tokens
- **Multi-factor Authentication**: Enhanced security for sensitive operations

### 💬 Communication Platform
- **Unit Groups**: Organized by course units with different group types
- **Real-time Messaging**: Instant messaging with Socket.io
- **File Sharing**: Secure document and media sharing
- **Message History**: Persistent chat history with search functionality

### 📝 Assessment System
- **Secure Environment**: Full-screen mode with tab monitoring
- **Anti-cheat Measures**: 
  - Copy-paste prevention
  - Right-click blocking
  - Keyboard shortcut restrictions
  - Browser focus monitoring
- **Auto-submission**: Time-based automatic submission
- **Progress Tracking**: Real-time answer saving and progress monitoring

### 📚 Assignment Management
- **Submission Portal**: Drag-and-drop file uploads with validation
- **Grading Interface**: Comprehensive grading tools for lecturers
- **Feedback System**: Detailed feedback and comments
- **Plagiarism Detection**: Integrated similarity checking
- **Analytics**: Submission statistics and engagement metrics

### 📖 Learning Resources
- **Resource Library**: Centralized document and media storage
- **Download Tracking**: Analytics on resource usage
- **Categorization**: Organized by units and resource types
- **Search & Filter**: Advanced search capabilities
- **Access Control**: Role-based resource visibility

### 📊 Analytics & Reporting
- **Performance Metrics**: Student and class performance analytics
- **Engagement Tracking**: Resource usage and participation metrics
- **Custom Reports**: Downloadable reports with digital watermarking
- **Real-time Dashboards**: Live analytics for lecturers and administrators

### 🔬 Research Tools
- **Citation Generator**: Multiple citation formats (APA, MLA, Chicago, Harvard)
- **Plagiarism Checker**: Advanced similarity detection
- **Literature Management**: Research paper organization
- **Collaboration Tools**: Shared research projects and notes

## 🔧 API Documentation

### Authentication Endpoints
\`\`\`
POST /auth/login          # SSO login
POST /auth/refresh        # Refresh JWT token
POST /auth/logout         # Logout user
GET  /auth/profile        # Get user profile
\`\`\`

### Academic Endpoints
\`\`\`
GET    /units             # List user's units
POST   /assignments       # Submit assignment
GET    /assignments/:id   # Get assignment details
POST   /cats              # Start CAT session
GET    /marks             # Get user marks
POST   /resources         # Upload resource
GET    /reports           # Generate reports
\`\`\`

### Communication Endpoints
\`\`\`
GET    /chat/groups       # List user's chat groups
POST   /chat/messages     # Send message
GET    /chat/history/:id  # Get chat history
POST   /chat/upload       # Upload file to chat
\`\`\`

## 🐳 Deployment

### Docker Deployment
\`\`\`bash
# Build and run with Docker Compose
docker-compose up -d

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

### Kubernetes Deployment
\`\`\`bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -l app=academic-hub
\`\`\`

### Manual Deployment
\`\`\`bash
# Build frontend
npm run build

# Build backend
cd backend
npm run build

# Start production servers
npm run start
\`\`\`

## 🔒 Security Features

- **Digital Watermarking**: Tamper-proof documents with cryptographic signatures
- **Anti-cheat System**: Comprehensive monitoring during assessments
- **Data Encryption**: End-to-end encryption for sensitive data
- **Access Control**: Role-based permissions and resource access
- **Audit Logging**: Comprehensive activity logging and monitoring
- **HTTPS/SSL**: Secure communication protocols
- **Input Validation**: Comprehensive input sanitization and validation

## 📱 Mobile App

The React Native mobile app provides full feature parity with the web application:

- Native authentication with biometric support
- Real-time chat with push notifications
- Offline assessment capability
- File upload and download
- Native camera integration for document scanning
- Dark mode support

### Mobile Setup
\`\`\`bash
cd mobile
npm install
npx expo start
\`\`\`

## 🧪 Testing

\`\`\`bash
# Run frontend tests
npm test

# Run backend tests
cd backend
npm test

# Run mobile tests
cd mobile
npm test

# Run end-to-end tests
npm run test:e2e
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use conventional commit messages
- Add tests for new features
- Update documentation for API changes
- Follow the existing code style and patterns

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@academichub.edu
- 📖 Documentation: [docs.academichub.edu](https://docs.academichub.edu)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/academic-hub/issues)
- 💬 Community: [Discord Server](https://discord.gg/academichub)

## 🙏 Acknowledgments

- Built with [v0.app](https://v0.app) - AI-powered development platform
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Deployed on [Vercel](https://vercel.com/)

---

**[🚀 Live Demo](https://vercel.com/elifamilytv-3968s-projects/v0-academichubfeatmajorfeatureexpa)** | **[📖 Documentation](https://docs.academichub.edu)** | **[🛠️ Continue Building](https://v0.app/chat/projects/8D7rioeuQZW)**

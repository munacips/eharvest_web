# eHarvest Web App - React Implementation

A modern web application for the eHarvest farm-commerce marketplace platform. This web version mirrors the functionality of the Flutter mobile app, connecting farmers, buyers, and logistics providers.

## 🌾 Project Overview

eHarvest is a comprehensive farm-commerce platform that combines:
- **Marketplace**: Farmers list produce, buyers browse and purchase
- **Subscriptions**: Recurring delivery services
- **Logistics**: Delivery coordination and tracking
- **AI/Analytics**: Market insights, price predictions, seasonal recommendations
- **Communication**: Real-time chat between users
- **Payments**: Multi-currency support (USD and ZIG)
- **Notifications**: Firebase push notifications

## 📁 Project Structure

```
src/
├── pages/                  # Page components (11 pages)
│   ├── SplashPage.tsx     # Loading/redirect screen
│   ├── LoginPage.tsx      # User authentication
│   ├── SignupPage.tsx     # User registration (role-based)
│   ├── DashboardPage.tsx  # Main dashboard (role-specific)
│   ├── BuyPage.tsx        # Product browsing & cart
│   ├── SellPage.tsx       # Farmer produce management
│   ├── CheckoutPage.tsx   # Checkout & payment
│   ├── AnalyticsPage.tsx  # Market insights & AI
│   ├── ChatPage.tsx       # Real-time messaging
│   ├── AccountPage.tsx    # User profile management
│   └── LogisticsPage.tsx  # Logistics request management
├── components/            # Reusable components
│   ├── Layout.tsx         # Main layout wrapper
│   ├── ProtectedRoute.tsx # Route protection
│   └── index.ts           # Component exports
├── services/              # API service layer (10 services)
│   ├── AuthService.ts     # Authentication
│   ├── ProductService.ts  # Produce management
│   ├── OrderService.ts    # Order management
│   ├── PaymentService.ts  # Payments & wallet
│   ├── SubscriptionService.ts # Subscriptions
│   ├── LogisticsService.ts    # Logistics
│   ├── ChatService.ts     # WebSocket chat
│   ├── ReviewService.ts   # Reviews & ratings
│   ├── AIService.ts       # AI/ML endpoints
│   ├── NotificationService.ts # Firebase FCM
│   └── index.ts           # Service exports
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── types/                 # TypeScript types
│   └── index.ts           # All type definitions
├── utils/                 # Utility functions
│   ├── config.ts          # API configuration
│   ├── apiClient.ts       # Axios configuration
│   └── (other utilities)
├── hooks/                 # Custom React hooks
├── App.tsx                # Main routing
├── main.tsx               # App entry point
└── index.css              # Tailwind CSS styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend API running at `http://localhost:8080`

### Installation

1. **Clone the repository**
   ```bash
   cd c:\Users\munashe\Projects\eharvest-main\eharvest_web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create `.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:8080
   REACT_APP_WS_URL=ws://localhost:8080/ws/chat
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   App will be available at `http://localhost:5173`

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔐 Authentication

### Login Credentials (Demo)
- **Farmer**: username: `farmer` | password: `password`
- **Buyer**: username: `buyer` | password: `password`
- **Logistics**: username: `logistics` | password: `password`

### Auth Flow
1. User logs in on LoginPage
2. Credentials sent to `/auth/login`
3. Backend returns JWT token + user details
4. Token stored in localStorage
5. AuthContext provides token to all API calls
6. SplashPage redirects to dashboard on success

## 🛣️ Routing Structure

```
/                   → SplashPage (redirect to /login or /dashboard)
/login              → LoginPage
/signup             → SignupPage (role selection + form)
/dashboard          → DashboardPage (protected, role-specific)
/buy                → BuyPage (buyer only)
/sell               → SellPage (farmer only)
/checkout           → CheckoutPage (buyer only)
/logistics          → LogisticsPage (logistics only)
/analytics          → AnalyticsPage (all roles)
/chat               → ChatPage (all roles)
/account            → AccountPage (all roles)
```

## 🔌 API Integration

All API calls go through the service layer. Each service method corresponds to a backend endpoint:

### Example: Creating a Product
```typescript
// Service
ProductService.createProduce({ name, category, quantity, ... })
  // Makes: POST /api/produce

// Page Component
const { createProduct } = ProductService;
const handleSubmit = async (data) => {
  await createProduct(data);
};
```

## 🎨 Styling

The app uses **Tailwind CSS** for styling:
- Mobile-first responsive design
- Dark mode support (built-in)
- Custom color scheme (green-focused for agriculture)
- Utility-first approach

### Key Classes
- `bg-green-600` - Primary brand color
- `shadow-md` - Card shadows
- `rounded-lg` - Border radius
- `px-4 py-2` - Padding utilities
- `md:grid-cols-2` - Responsive grids

## 📊 State Management

Uses React hooks + Context API (no Redux):
- **AuthContext**: User authentication state
- **Component State**: Managed with `useState`
- **Server State**: Managed with API service layer
- **Side Effects**: Handled with `useEffect`

## 🔄 Key Features

### 1. Role-Based Access Control
- Different UI for Farmer/Buyer/Logistics
- Protected routes with role validation
- NavItems adjust based on user role

### 2. Real-Time Chat
- WebSocket-based messaging via STOMP
- Message polling as fallback
- Conversation list with unread counts

### 3. AI/Analytics
- Price predictions for commodities
- Market demand/supply forecasting
- Seasonal crop recommendations
- Weather integration

### 4. Marketplace
- Product search with filters
- Add to cart functionality
- Checkout with multiple payment methods
- Order tracking

### 5. Subscriptions
- Recurring delivery setup
- Frequency management (weekly/bi-weekly/monthly)
- Status tracking (active/paused/cancelled)

### 6. Notifications
- Firebase Cloud Messaging (FCM)
- Foreground/background/terminated states
- Token registration with backend

## 🔧 Services Details

### AuthService
- `login()`, `register()`, `logout()`
- `getToken()`, `getProfile()`, `isAuthenticated()`
- JWT token management

### ProductService
- `getAllProduce()`, `getProduceById()` 
- `searchProduce()`, `createProduce()`, `updateProduce()`
- `getFarmerProduce()`

### OrderService
- `createOrder()`, `getOrder()`, `updateOrderStatus()`
- `acceptOrder()`, `confirmDelivery()`
- `getFarmerOrders()`, `getBuyerOrders()`

### PaymentService
- `initiatePayment()`, `getPaymentReturn()`
- `getWalletBalance()`, `getPaymentHistory()`
- Multi-currency support (USD/ZIG)

### ChatService
- `getConversations()`, `getMessages()`
- `sendMessage()`, `createConversation()`
- WebSocket connection management

### AIService
- `predictPrice()`, `forecastCommodity()`
- `getDemandSupplyForecast()`, `getSeasonRecommendations()`
- `getMarketInsights()`, `getWeatherIntegration()`

### LogisticsService
- `getLogisticsRequest()`, `getLogisticsRequests()`
- `acceptRequest()`, `rejectRequest()`, `markInTransit()`, `markDelivered()`
- `getSupplyMap()` - Geolocation-based supply visualization

## 📝 Environment Configuration

Update `src/utils/config.ts` to configure:
- Backend API base URL
- WebSocket URL
- Firebase credentials
- API endpoints

## 🚨 Error Handling

All services include try-catch blocks. On 401 (Unauthorized):
- Token cleared from localStorage
- User redirected to login
- AuthContext resets

## 📦 Dependencies

### Core
- `react@19.2.6` - UI library
- `react-dom@19.2.6` - DOM rendering
- `react-router-dom@7.0.0` - Routing
- `typescript@6.0.2` - Type safety

### Data & Forms
- `axios@1.6.0` - HTTP client
- `react-hook-form@7.50.0` - Form management
- `@tanstack/react-query@5.0.0` - Server state

### UI & Styling
- `tailwindcss@3.4.0` - Utility CSS
- `lucide-react@0.378.0` - Icons

### Real-Time & Notifications
- `firebase@10.0.0` - Firebase SDK
- `stomp-js@2.3.3` - WebSocket protocol

### Maps
- `leaflet@1.9.4` - Map library
- `react-leaflet@4.2.1` - React wrapper

## 🐛 Common Issues & Solutions

### Issue: CORS errors
**Solution**: Ensure backend has CORS configured for `http://localhost:5173`

### Issue: Chat not loading
**Solution**: Check WebSocket URL in config.ts. May need to adjust RECONNECT_DELAY

### Issue: Firebase notifications not working
**Solution**: Replace `YOUR_VAPID_KEY_HERE` in NotificationService.ts

### Issue: Map not displaying
**Solution**: Verify Leaflet CSS is imported and coordinate data is valid

## 📚 Additional Resources

- [Flutter App Repository](https://github.com/munacips/eharvest_mobile.git)
- React Documentation: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- React Router: https://reactrouter.com
- Firebase: https://firebase.google.com

## 🤝 Contributing

When adding new features:
1. Create page component in `src/pages/`
2. Create corresponding service in `src/services/` if needed
3. Add route in `App.tsx`
4. Update types in `src/types/index.ts`
5. Use Tailwind CSS for styling
6. Add error handling in try-catch blocks

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for sustainable agriculture**

For questions or support, please contact the development team.

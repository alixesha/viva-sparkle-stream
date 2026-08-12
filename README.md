# Viva Live Streams

Build a complete mobile-first live-streaming social application called "VIVA LIVE" from scratch.



The application should be inspired by the feature set of modern live-streaming apps such as Mico Live, but must have completely original branding, UI, graphics, animations, and design.



IMPORTANT:

Build the application as a real working Supabase-backed application, not a static prototype.



For the first version, use TEST/MANUAL COIN PURCHASE instead of real payment gateways.



Users can request/purchase coins, but coins are added ONLY after ADMIN APPROVAL.



No real-money automatic payment gateway is required in this version.



==================================================

TECH STACK



Frontend:



- React

- TypeScript

- Tailwind CSS

- Mobile-first responsive UI

- PWA-ready



Backend:



- Supabase

- PostgreSQL

- Supabase Auth

- Supabase Storage

- Supabase Realtime

- Supabase Edge Functions where required



Use secure environment variables.



Never expose service-role keys.



==================================================

DESIGN



Create a premium modern live-streaming UI.



Theme:



- Dark black background

- Purple/pink gradients

- Premium glass cards

- Smooth animations

- Neon-style accents

- Rounded UI

- Modern typography



Create original VIVA LIVE branding.



Main bottom navigation:



Home

Discover

Go Live

Messages

Profile



Use beautiful mobile-first layouts.



==================================================

AUTHENTICATION



Implement Supabase authentication:



- Sign Up

- Login

- Logout

- Forgot Password

- Password Reset

- Persistent Sessions



Signup:



- Email

- Password

- Username

- Display Name

- Country

- Profile Picture



Automatically create profile after signup.



Profiles:



- Avatar

- Username

- Display Name

- Bio

- Country

- Followers

- Following

- Level

- Badges



Users can edit their own profile.



==================================================

HOME



Home screen:



Top:



- VIVA LIVE logo

- Search

- Notifications

- Coin balance



Sections:



LIVE NOW



- Live room cards

- Host avatar

- Host name

- LIVE badge

- Viewer count

- Category

- Thumbnail



POPULAR HOSTS



TRENDING



FOLLOWING



RECOMMENDED



Clicking a live room opens the live room.



==================================================

DISCOVER



Create:



- Search

- Categories

- Popular hosts

- Trending rooms

- New hosts

- Country filter

- Language filter

- Gender filter

- Popularity filter

- Viewer-count filter



Filters must actually work with Supabase queries.



==================================================

REAL LIVE HOSTING



Create a complete live-room architecture.



Use a modular streaming service designed for LiveKit integration.



Live room features:



HOST:



- Start Live

- End Live

- Camera ON/OFF

- Microphone ON/OFF

- Switch camera

- Live title

- Category

- Cover/thumbnail

- Viewer list

- Mute viewer

- Remove viewer

- Block viewer

- Host controls



VIEWER:



- Watch live

- Join room

- Leave room

- Follow host

- Like

- Share

- Report

- Block

- Live chat

- Send gifts



Create:



live_rooms



- id

- host_id

- title

- category

- thumbnail_url

- status

- viewer_count

- stream_channel_id

- started_at

- ended_at

- created_at



live_participants



- id

- room_id

- user_id

- joined_at

- left_at



Use Supabase Realtime for chat, room status and participant updates.



IMPORTANT:

Do not pretend video streaming is real if no streaming provider credentials exist.



Create a StreamingService abstraction with LiveKit-compatible implementation so actual camera/video streaming can be enabled by adding credentials.



Until configured, show a clearly labeled "TEST STREAM" video area.



==================================================

LIVE CHAT



Create real-time chat.



Features:



- Text messages

- Emoji

- User avatars

- Host badge

- Moderator badge

- System messages

- Gift messages

- Join messages



Use Supabase Realtime.



Host/moderators can:



- Mute user

- Remove user

- Block user



==================================================

FOLLOW SYSTEM



Implement:



- Follow

- Unfollow

- Followers

- Following



Prevent duplicate follows and following yourself.



==================================================

COIN SYSTEM



Create a complete TEST COIN economy.



Users have a wallet.



Display:



💰 TEST COINS



Coin balance must never be editable directly from frontend.



Create coin packages:



Example:



1,000 Coins

5,000 Coins

10,000 Coins

50,000 Coins

100,000 Coins



Admin can change:



- Package name

- Coin amount

- Display price

- Active/inactive



==================================================

COIN PURCHASE REQUEST



IMPORTANT:



Do NOT connect Stripe, PayPal or any real payment gateway.



Create a manual/admin-approved coin purchase system.



User flow:



User selects coin package

→ Purchase Request

→ Shows payment instructions configured by admin

→ User submits:



- Package

- Amount

- Payment reference/transaction ID

- Optional screenshot

  → Status = PENDING

  → Admin reviews

  → Admin APPROVES

  → Coins are automatically added to user's wallet

  → Transaction recorded

  → User receives notification



Admin can:



- Approve

- Reject

- View screenshot

- View transaction/reference ID

- Add coins

- Remove coins

- View complete transaction history



Every coin change must create an immutable ledger record.



Show:



TEST MODE

NO AUTOMATIC REAL PAYMENT



==================================================

WALLETS



User wallet:



- Test coin balance

- Purchase history

- Gift spending

- Transactions



Host wallet:



- Test diamonds

- Gifts received

- Earnings

- Withdrawal balance



Never allow client-side balance manipulation.



Use secure database functions/RLS.



==================================================

VIRTUAL GIFTS



Create a beautiful gift system similar in functionality to modern live apps.



Gift catalog:



- Rose

- Heart

- Kiss

- Star

- Fire

- Crown

- Rocket

- Diamond

- Luxury gift

- Custom premium gifts



Each gift:



- Name

- Icon

- Animation

- Coin price

- Diamond reward

- Active status

- Sort order



Admin can:



- Add gift

- Edit gift

- Delete/deactivate gift

- Set price

- Upload icon

- Upload animation



==================================================

GIFT ANIMATIONS



When a viewer sends a gift:



1. Deduct TEST COINS securely.

2. Add TEST DIAMONDS to host.

3. Create gift transaction.

4. Display animated gift on live screen.

5. Display sender name.

6. Display receiver/host name.

7. Display gift name.

8. Play animation overlay.

9. Show gift notification in chat.



Create a reusable GiftAnimation component.



Support:



- Small gift animation

- Large screen animation

- Full-screen premium gift animation



Use CSS/Lottie-compatible animation architecture.



If animation assets are not available, create elegant animated placeholders that can later be replaced with Lottie/GIF/MP4 assets.



==================================================

PK BATTLE



Implement Host vs Host PK battle.



Features:



- Host invitation

- Accept/decline

- Countdown

- Two-sided live layout

- Host avatars

- Gift score

- Real-time score updates

- Timer

- Winner

- Battle history

- Winner animation



Scores must be calculated server-side from gift transactions.



==================================================

HOST SYSTEM



Create host application.



User can:



- Apply to become host

- Submit application

- Wait for admin approval



Admin:



- Approve

- Reject

- Suspend

- Reactivate host



Host dashboard:



- Total live time

- Followers

- Test diamonds

- Gifts received

- Estimated test earnings

- Rankings

- Live history

- Withdrawal requests



==================================================

WITHDRAWAL TEST SYSTEM



Create TEST withdrawal system.



Host can request withdrawal of test earnings.



Fields:



- Amount

- Payout method

- Payout details



Statuses:



- Pending

- Approved

- Processing

- Completed

- Rejected



Admin manages all withdrawals.



No real money is transferred.



Clearly display:



TEST WITHDRAWAL

NO REAL MONEY



==================================================

LEVELS



Create user levels and host levels.



XP from:



- Watching lives

- Following

- Sending gifts

- Hosting

- Receiving gifts

- Engagement



Create:



- Level

- XP

- Progress bar

- Badges



==================================================

RANKINGS



Create:



- Top Hosts

- Top Gifters

- Daily ranking

- Weekly ranking

- Monthly ranking

- Global ranking

- Country ranking



Use real database activity.



==================================================

MESSAGING



Create private one-to-one messaging.



Features:



- Conversations

- Text

- Emoji

- Images

- Read/unread

- Online status

- Notifications

- Block restrictions



Use Supabase Realtime.



==================================================

NOTIFICATIONS



Notifications for:



- New follower

- Host goes live

- Gift received

- Coins approved

- Coins rejected

- Withdrawal approved

- Withdrawal rejected

- PK invitation

- New message

- Host application approved/rejected

- Admin announcements



==================================================

AGENCY SYSTEM



Create agency system.



Agency:



- Name

- Owner

- Status

- Commission percentage



Agency members:



- Hosts

- Earnings

- Live hours

- Gifts

- Performance



Agency dashboard.



Admin can approve/suspend agencies.



==================================================

MODERATION



Implement:



- Report user

- Report live room

- Block

- Mute

- Remove viewer

- Temporary ban

- Permanent ban

- Suspend host

- End live room



Report categories:



- Harassment

- Spam

- Scam

- Sexual content

- Violence

- Hate

- Illegal activity

- Other



==================================================

ADMIN PANEL



Create a complete protected admin dashboard.



Dashboard statistics:



- Total users

- Active users

- Live rooms

- Hosts

- Pending host applications

- Coin purchase requests

- Coins issued

- Gifts sent

- Test diamonds

- Withdrawals

- Reports



Admin sections:



/admin/users

/admin/hosts

/admin/live

/admin/coin-requests

/admin/coin-packages

/admin/gifts

/admin/wallets

/admin/transactions

/admin/withdrawals

/admin/pk-battles

/admin/agencies

/admin/reports

/admin/bans

/admin/categories

/admin/notifications

/admin/settings

/admin/audit-logs



Admin capabilities:



USERS:



- Search

- View

- Suspend

- Ban

- Unban

- Adjust test coins

- View transactions



HOSTS:



- Approve

- Reject

- Suspend

- View earnings

- View live history



COIN REQUESTS:



- View pending requests

- View payment reference

- View screenshot

- Approve

- Reject

- Add coins automatically after approval



GIFTS:



- Create

- Edit

- Delete

- Activate/deactivate

- Set coin price

- Set diamond reward

- Upload animation



WITHDRAWALS:



- Approve

- Reject

- Process

- Complete



REPORTS:



- Review

- Resolve

- Take action



SETTINGS:



- Coin packages

- Gift prices

- Withdrawal minimum

- Host commission

- Agency commission

- Categories

- App settings



==================================================

DATABASE + SECURITY



Create complete Supabase PostgreSQL schema.



Tables should include:



profiles

follows

blocks

hosts

host_applications

agencies

agency_members

live_rooms

live_participants

live_messages

conversations

messages

notifications

wallets

coin_packages

coin_purchase_requests

coin_transactions

gifts

gift_transactions

host_earnings

withdrawals

pk_battles

levels

rankings

reports

bans

categories

admin_actions

app_settings



Enable RLS on ALL tables.



Important security:



- User can edit only own profile.

- User cannot directly change wallet balance.

- User cannot create fake coin transactions.

- User cannot create fake gift transactions.

- Host cannot change own earnings.

- Host can control only own live room.

- Admin routes are protected.

- Coin approval must happen server-side/database-side.

- Gift transactions must happen server-side/database-side.

- Prevent negative balances.

- Prevent duplicate transactions.

- Add database constraints and indexes.



==================================================

STORAGE



Use Supabase Storage for:



- Profile pictures

- Live thumbnails

- Gift icons

- Gift animations

- Chat images

- Payment proof screenshots



Add file-size/type validation.



==================================================

SEARCH + FILTERS



Implement real search/filtering for:



- Hosts

- Users

- Live rooms

- Categories

- Country

- Language

- Viewer count

- Popularity



==================================================

PAGES



Create:



Splash

Welcome

Login

Signup

Forgot Password

Home

Discover

Go Live

Live Room

Messages

Chat

Profile

Other User Profile

Wallet

Buy Coins

Coin Purchase Request

Transactions

Gift Catalog

Host Dashboard

Host Application

Rankings

PK Battle

Withdrawals

Settings

Notifications

Help/Support

Terms

Privacy

Community Guidelines

Account Deletion



Admin panel with all management pages.



==================================================

UI QUALITY



Make everything:



- Mobile-first

- Responsive

- Fast

- Premium

- Smooth

- Accessible

- Touch-friendly



Add:



- Skeleton loaders

- Loading states

- Empty states

- Error states

- Toast notifications

- Confirmation dialogs



Do not use generic ugly placeholder UI.



==================================================

IMPORTANT TEST MODE



This version uses:



REAL USER ACCOUNTS

REAL SUPABASE DATABASE

REAL LIVE ROOM DATABASE

REAL CHAT

REAL FOLLOW SYSTEM

REAL TEST COINS

REAL TEST GIFTS

REAL TEST DIAMONDS

REAL TEST WITHDRAWALS



BUT:



NO REAL PAYMENT GATEWAY

NO REAL MONEY

NO AUTOMATIC CARD PAYMENT



All coin/payment/withdrawal screens must clearly show:



"TEST MODE — NO REAL MONEY"



Design the architecture so real payment providers can be added later without rebuilding the wallet/gift system.



==================================================

FINAL REQUIREMENT



Build the entire application from scratch in this single project.



Do not stop after creating UI.



Implement the database schema, authentication, RLS policies, realtime subscriptions, backend functions, admin panel, user flows, host flows, live-room flows, chat, test coins, manual coin approval, gifts, gift animations, test diamonds, PK battle, rankings, messaging, notifications, moderation and test withdrawals.



Use real Supabase data instead of hardcoded mock data wherever possible.



Fix TypeScript, database, routing and build errors.



Make the application build successfully.



Do not claim real camera streaming or real payments are active unless the required external provider credentials are configured.



The final result should be a complete VIVA LIVE TEST MODE application that can be fully tested by creating users, approving hosts, creating live rooms, chatting, purchasing test coins through admin approval, sending animated gifts, earning test diamonds, running PK battles and processing test withdrawals.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://viva-sparkle-stream.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2e2cff66-1a79-4373-96cd-bb9241ddfe39).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

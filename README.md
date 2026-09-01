# FoodMan

Hyper-local food delivery platform built for speed, real-time tracking, and role-based portal isolation (Customer, Rider, Vendor, Admin).

---

## Seed Login Credentials

> **Default Password for All Seed Accounts**: `password123`

### 1. Platform Admin
| Name | Phone Number | Email | Role | Portal Route |
|---|---|---|---|---|
| Admin Tahsin | `01700000000` | `admin@foodman.com` | `ADMIN` | `/admin` |

### 2. Customers
| Name | Phone Number | Email | Role | Portal Route |
|---|---|---|---|---|
| Tahsin | `01795368446` | `tahsin@example.com` | `CUSTOMER` | `/` |
| Sarah Rahman | `01811223344` | `sarah@example.com` | `CUSTOMER` | `/` |

### 3. Restaurant Owners (Vendors)
| Name | Phone Number | Email | Restaurant Name | Zone | Portal Route |
|---|---|---|---|---|---|
| Rahim Khan | `01711111111` | `takeout@foodman.com` | Takeout Burgers | Banani | `/vendor` |
| Karim Mia | `01722222222` | `pizzaguy@foodman.com` | Pizza Guy | Gulshan | `/vendor` |
| Sultan Ahmed | `01733333333` | `sultans@foodman.com` | Sultan's Dine | Dhanmondi | `/vendor` |
| Chef Hiroshi | `01744444444` | `tokyo@foodman.com` | Tokyo Express | Banani | `/vendor` |

### 4. Delivery Riders (Couriers)
| Name | Phone Number | Email | Vehicle Type | Portal Route |
|---|---|---|---|---|
| Kabir Hossain | `01755555555` | `rider1@foodman.com` | Motorcycle | `/rider` |
| Salam Mia | `01766666666` | `rider2@foodman.com` | Bicycle | `/rider` |

---

## Running the Application

### Server (Backend API)
```bash
cd server
npm install
npm run dev
```
- API Base URL: `http://localhost:5000/api/v1`

### Client (Next.js Frontend)
```bash
cd client
npm install
npm run dev
```
- Client URL: `http://localhost:3000`

### Re-seeding Database
```bash
cd server
npm run seed
```

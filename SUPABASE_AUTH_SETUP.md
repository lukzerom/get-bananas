# 🔐 Supabase Authentication Setup Guide

This guide explains how to properly configure Supabase authentication for the Get Bananas shopping app to work with Expo development and avoid redirect URL issues.

## 🚨 Current Issues Fixed

1. **Infinite loading on registration** - Fixed by properly handling signup response and loading states
2. **Localhost redirect issues** - Fixed by using deep linking with custom URL scheme

## 📱 Deep Linking Configuration

### Already Configured in `app.json`:

```json
{
  "expo": {
    "scheme": "get-bananas"
  }
}
```

### Supabase Service Updated:

- Email redirect URL set to: `get-bananas://auth/callback`
- Session detection enabled for URL handling

## ⚙️ Supabase Dashboard Configuration

### 1. Site URL Configuration

In your Supabase dashboard → Authentication → URL Configuration:

**Site URL:** Set to your production domain or development URL

- Development: `exp://192.168.1.xxx:8081` (use your actual IP)
- Production: `https://yourdomain.com`

### 2. Redirect URLs

Add these redirect URLs in Authentication → URL Configuration:

**Development:**

```
exp://192.168.1.xxx:8081
get-bananas://auth/callback
http://localhost:8081
```

**Production:**

```
get-bananas://auth/callback
https://yourdomain.com
```

**Important:** Replace `192.168.1.xxx` with your actual local IP address. You can find it by running:

```bash
ipconfig getifaddr en0  # macOS
hostname -I            # Linux
ipconfig               # Windows
```

### 3. Email Templates (Optional)

You can customize the email confirmation template in:
Authentication → Email Templates → Confirm signup

Default redirect URL in template: `{{ .ConfirmationURL }}`

## 🔄 Authentication Flow

### Registration Flow:

1. User fills registration form
2. Form submission calls `signUp()`
3. Supabase sends confirmation email
4. Loading state properly resets
5. User redirected to email confirmation screen
6. User clicks email link → opens app via deep link
7. App handles callback and signs user in

### Email Confirmation Flow:

1. User receives email with link: `get-bananas://auth/callback?access_token=...&refresh_token=...`
2. Link opens app (if installed) or prompts to install
3. `app/auth/callback.tsx` handles the deep link
4. Tokens extracted from URL and set in Supabase session
5. User automatically signed in and redirected to home

## 🛠 Development Setup

### 1. Get Your Local IP

```bash
# Run this to get your local IP address
ipconfig getifaddr en0
```

### 2. Update Supabase Redirect URLs

Add your local IP to Supabase dashboard redirect URLs:

```
exp://YOUR_LOCAL_IP:8081
```

### 3. Test Email Confirmation

1. Start Expo development server: `npm run start`
2. Register with a real email address
3. Check email on same device (phone/computer)
4. Click confirmation link
5. App should open and complete authentication

## 📱 Testing on Different Devices

### iOS Simulator:

- Deep links work automatically
- Use `exp://localhost:8081` in Supabase config

### Android Emulator:

- Deep links work automatically
- Use `exp://10.0.2.2:8081` in Supabase config

### Physical Device:

- Must be on same network as development machine
- Use your computer's local IP address
- Example: `exp://192.168.1.100:8081`

## 🚀 Production Deployment

When deploying to production:

1. **Update Site URL** to your production domain
2. **Update Redirect URLs** to your production URLs
3. **Configure deep linking** in your app store listings
4. **Test email flow** in production environment

## 🐛 Troubleshooting

### Email Confirmation Not Working:

1. Check Supabase redirect URLs include your deep link scheme
2. Verify your local IP address is correct
3. Ensure device is on same network as development machine
4. Check email spam folder

### Deep Link Not Opening App:

1. Restart Expo development server
2. Clear app cache and reload
3. Verify scheme in `app.json` matches redirect URL
4. Test on different device/simulator

### Infinite Loading on Registration:

- Fixed in latest update - loading state properly resets after signup
- User redirected to email confirmation screen

## 📋 Required Supabase Settings Summary

| Setting                | Value                                                     |
| ---------------------- | --------------------------------------------------------- |
| Site URL               | `exp://YOUR_LOCAL_IP:8081` (dev)                          |
| Redirect URLs          | `get-bananas://auth/callback`, `exp://YOUR_LOCAL_IP:8081` |
| Email Redirect         | `get-bananas://auth/callback`                             |
| Confirm signup enabled | ✅                                                        |
| Auto-confirm           | ❌ (disabled for security)                                |

## 🔜 Future Enhancements

- [ ] Add resend confirmation email functionality
- [ ] Implement password reset flow with deep linking
- [ ] Add social authentication (Google, Apple)
- [ ] Handle expired confirmation links gracefully

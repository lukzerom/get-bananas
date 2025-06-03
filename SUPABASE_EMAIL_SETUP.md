# 📧 Supabase Email Confirmation Setup Guide

This guide will help you properly configure Supabase email confirmation for the Get Bananas app to work seamlessly with deep links.

## 🚨 Current Issue

You mentioned that confirmation emails still contain `localhost:3000` links instead of your app's deep link scheme. This guide will fix that.

## 🔧 Step-by-Step Configuration

### 1. Configure Supabase Project Settings

#### A. Navigate to Your Supabase Dashboard

1. Go to [supabase.com](https://supabase.com)
2. Select your "Get Bananas" project
3. Go to **Authentication** → **URL Configuration**

#### B. Set the Site URL

- **For Development**: `get-bananas://`
- **For Production**: `get-bananas://` (or your custom domain if you have one)

#### C. Add Redirect URLs

Add these URLs to the **Redirect URLs** list:

**For Development:**

```
get-bananas://auth/callback
exp://localhost:8081
exp://127.0.0.1:8081
```

**For Production:**

```
get-bananas://auth/callback
```

**💡 Pro Tip**: If testing on a physical device, also add your local network IP:

```
exp://YOUR_LOCAL_IP:8081
```

To find your local IP:

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"
```

### 2. Configure Email Templates

#### A. Navigate to Email Templates

1. In Supabase Dashboard: **Authentication** → **Email Templates**
2. Select **Confirm signup**

#### B. Update the Email Template

Replace the existing template with this improved version:

```html
<h2>Welcome to Get Bananas! 🛒</h2>

<p>
  Thanks for signing up! Please confirm your email address to get started with
  your shopping lists.
</p>

<p style="margin: 20px 0;">
  <a
    href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email"
    style="background-color: #007AFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;"
  >
    Confirm Email Address
  </a>
</p>

<p>
  <small
    >If the button doesn't work, copy and paste this link into your browser:<br />
    {{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email</small
  >
</p>

<p>
  <small
    >This link will expire in 24 hours. If you didn't create an account, please
    ignore this email.</small
  >
</p>
```

**Important**: Make sure to use `{{ .RedirectTo }}` instead of `{{ .SiteURL }}` to ensure the deep link is used.

### 3. Verify Your App Configuration

#### A. Check `app.json`

Ensure your scheme is properly configured:

```json
{
  "expo": {
    "scheme": "get-bananas"
  }
}
```

✅ **Already configured correctly in your app!**

#### B. Check Supabase Service

Verify the `emailRedirectTo` in your signup function:

```typescript
emailRedirectTo: "get-bananas://auth/callback";
```

✅ **Already configured correctly in your app!**

## 🧪 Testing the Email Flow

### 1. Test Registration

1. Start your Expo dev server: `npm start`
2. Register with a **real email address** you can access
3. Check your email (including spam folder)
4. The email should now contain a link like: `get-bananas://auth/callback?token_hash=...&type=email`

### 2. Test Email Confirmation

1. Click the confirmation link in the email
2. Your app should open automatically
3. You should see the confirmation screen processing
4. After successful confirmation, you'll be redirected to the home screen

## 🛠 Troubleshooting

### Problem: Email still contains localhost:3000

**Solution**:

1. Double-check that **Site URL** in Supabase is set to `get-bananas://`
2. Make sure you're using `{{ .RedirectTo }}` in the email template, not `{{ .SiteURL }}`
3. Clear your browser cache and restart your Supabase project if needed

### Problem: Deep link doesn't open the app

**Solutions**:

1. Restart your Expo development server
2. Make sure your device/simulator supports deep links
3. Test on a different device
4. Check that the scheme in `app.json` matches exactly

### Problem: "No valid authentication data found"

**Solutions**:

1. Check that the email template uses the correct parameters
2. Verify the link wasn't modified by email providers
3. Try clicking the link on the same device where the app is installed

### Problem: App opens but shows error

**Solutions**:

1. Check Expo logs for detailed error messages
2. Verify your Supabase URL and API key are correct
3. Ensure your Supabase project has email confirmation enabled

## 📱 Platform-Specific Notes

### iOS

- Deep links work automatically in iOS Simulator
- On physical devices, make sure you're signed into the same Apple ID

### Android

- Deep links work automatically in Android Emulator
- On physical devices, the app must be installed for deep links to work

### Web

- Web version will use regular HTTPS URLs instead of deep links
- Make sure to add your web domain to Supabase redirect URLs for production

## 🚀 Production Deployment

When deploying to production:

1. **Update Supabase URLs**:

   - Site URL: Your production domain or keep `get-bananas://`
   - Redirect URLs: Add your production domain

2. **Test the full flow**:

   - Registration → Email → Confirmation → Sign in

3. **Monitor email delivery**:
   - Check Supabase logs for email delivery status
   - Consider setting up custom SMTP for better deliverability

## 📋 Quick Checklist

- [ ] Site URL set to `get-bananas://` in Supabase
- [ ] Redirect URLs include `get-bananas://auth/callback`
- [ ] Email template uses `{{ .RedirectTo }}` not `{{ .SiteURL }}`
- [ ] App scheme is `get-bananas` in `app.json`
- [ ] Deep link handling is implemented in `_layout.tsx`
- [ ] Callback screen handles `token_hash` and `type` parameters
- [ ] Test with real email address
- [ ] Confirmation flow works end-to-end

## 🎯 Expected Flow

1. **User registers** → Gets "Check Your Email" screen
2. **User checks email** → Sees confirmation email with deep link
3. **User clicks link** → App opens to callback screen
4. **App verifies token** → Shows success message
5. **User redirected** → Goes to main app (home screen)
6. **User is signed in** → Can use the app normally

This setup ensures a seamless email confirmation experience that keeps users within your app ecosystem! 🎉

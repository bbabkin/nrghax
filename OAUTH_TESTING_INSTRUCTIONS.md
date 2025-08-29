# 🔒 OAuth Testing Instructions - CRITICAL SECURITY REQUIREMENTS

## ⚠️ GOOGLE OAUTH HTTPS REQUIREMENT

**CRITICAL**: Google OAuth requires HTTPS for all environments due to security compliance. HTTP will be rejected.

## 🧪 Testing Protocol for Agents

### When Testing Authentication Flows

**❌ INCORRECT**: Testing Google OAuth on HTTP will always fail
```bash
npm run dev  # HTTP server - OAuth will fail
```

**✅ CORRECT**: Use appropriate server for each auth method

#### Email/Password Authentication Testing
```bash
# HTTP server is sufficient for email/password auth
npm run dev -- --port 3002
# Test at: http://localhost:3002
```

#### Google OAuth Authentication Testing  
```bash
# HTTPS server REQUIRED for OAuth
npm run dev:https -- --port 3002
# Test at: https://localhost:3002
```

#### Complete Integration Testing
```bash
# HTTPS server for testing both auth methods together
npm run dev:https -- --port 3002
# Test both email/password AND Google OAuth
```

## 🔧 Environment Configuration for OAuth

### Development Environment
```bash
# For OAuth testing, update .env.local:
NEXTAUTH_URL=https://localhost:3002
APP_URL=https://localhost:3002

# Ensure Google OAuth credentials match HTTPS callback:
# Callback URL: https://localhost:3002/api/auth/callback/google
```

### Production Environment
```bash
# Production MUST use valid SSL certificate:
NEXTAUTH_URL=https://yourdomain.com
APP_URL=https://yourdomain.com

# Google Console callback:
# https://yourdomain.com/api/auth/callback/google
```

## 🎯 Agent Testing Instructions

### For @agent-testing-specialist

When creating OAuth tests:

1. **Environment Setup**: Always use HTTPS for OAuth tests
2. **Test Configuration**: Configure test to expect HTTPS endpoints
3. **Error Handling**: Test OAuth failure scenarios on HTTP (should fail gracefully)
4. **Documentation**: Include HTTPS requirement in test documentation

### For @agent-nextauth-security-specialist  

When implementing OAuth:

1. **Configuration Check**: Verify NEXTAUTH_URL uses HTTPS
2. **Callback Validation**: Ensure callback URLs match Google Console
3. **Error Messages**: Provide clear HTTPS requirement messages
4. **Environment Validation**: Check for HTTPS in OAuth provider setup

### For @agent-ui-component-developer

When building OAuth UI components:

1. **Error Display**: Show clear error message when HTTP is used for OAuth
2. **User Guidance**: Direct users to HTTPS for Google login
3. **Development Notes**: Include OAuth HTTPS requirement in component docs

## 🚨 Common OAuth Failures & Solutions

### Error: "This page isn't working - ERR_EMPTY_RESPONSE"
**Cause**: Testing Google OAuth on HTTP server
**Solution**: Switch to HTTPS dev server

### Error: "redirect_uri_mismatch" 
**Cause**: Google Console callback URL doesn't match server protocol
**Solution**: Ensure both use HTTPS and exact same URL

### Error: "invalid_client"
**Cause**: OAuth credentials misconfigured or protocol mismatch  
**Solution**: Verify Google Console settings match NEXTAUTH_URL

## 📋 Pre-Testing Checklist

Before testing OAuth functionality:

- [ ] ✅ HTTPS dev server started (`npm run dev:https`)
- [ ] ✅ NEXTAUTH_URL uses https:// protocol  
- [ ] ✅ Google Console callback URL uses https://
- [ ] ✅ Valid SSL certificate (self-signed OK for localhost)
- [ ] ✅ Port matches between server and environment config

## 🎉 Success Indicators

OAuth is working correctly when:

- ✅ Google login button redirects to actual Google OAuth page
- ✅ User can complete authentication on Google's site
- ✅ User is redirected back to application successfully  
- ✅ User session is created with proper profile data
- ✅ No console errors or empty responses

## 💡 Development vs Production

| Environment | Protocol | Certificate | Testing |
|-------------|----------|-------------|---------|
| Development | HTTPS | Self-signed OK | Use `npm run dev:https` |
| Staging | HTTPS | Valid SSL required | Test with real domain |
| Production | HTTPS | Valid SSL required | Full security compliance |

---

**Remember**: Google OAuth security requirements are non-negotiable. Always use HTTPS for OAuth testing and production deployments.
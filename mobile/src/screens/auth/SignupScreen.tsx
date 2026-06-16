import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { useUser } from '../../contexts/UserContext';
import { colors, spacing, radius, typography } from '../../theme/colors';
import { AuthStackParams } from '../../navigation/AppNavigator';

WebBrowser.maybeCompleteAuthSession();

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParams, 'Signup'>;
};

export default function SignupScreen({ navigation }: Props) {
  const { signup, googleLogin } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignup(id_token);
    }
  }, [response]);

  const handleGoogleSignup = async (idToken: string) => {
    setGoogleLoading(true);
    try {
      await googleLogin(idToken);
    } catch (err: any) {
      const code = err.response?.data?.code;
      const msg = err.response?.data?.error || 'Google sign-up failed. Please try again.';
      if (code === 'EMAIL_ACCOUNT_EXISTS') {
        Alert.alert(
          'Account Already Exists',
          'An account with this email already exists. Please sign in using your email and password.',
          [
            { text: 'Go to Sign In', onPress: () => navigation.navigate('Login') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Google Sign-Up Failed', msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signup(name.trim(), email.trim().toLowerCase(), password);
    } catch (err: any) {
      Alert.alert(
        'Signup Failed',
        err.response?.data?.error || err.response?.data?.message || 'Could not create account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Text style={styles.logo}>🧠</Text>
            <Text style={styles.title}>Get Started</Text>
            <Text style={styles.subtitle}>Create your Bouncy Brain account</Text>
          </View>

          <View style={styles.card}>
            {/* Google Sign-Up */}
            <TouchableOpacity
              style={[styles.googleBtn, (googleLoading || !request) && styles.btnDisabled]}
              onPress={() => promptAsync()}
              disabled={googleLoading || !request}
            >
              {googleLoading ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleBtnText}>Sign up with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.switchLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={styles.switchAction}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { fontSize: 64 },
  title: { ...typography.h1, marginTop: spacing.sm },
  subtitle: { ...typography.bodySmall, marginTop: spacing.xs },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 50,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.bodySmall, color: colors.textMuted },

  inputGroup: { gap: spacing.xs },
  label: { ...typography.label },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
  },
  inputFlex: { flex: 1 },
  eyeBtn: { padding: spacing.xs },

  btn: {
    backgroundColor: colors.violet,
    borderRadius: radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },

  switchLink: { alignItems: 'center', marginTop: spacing.lg },
  switchText: { ...typography.bodySmall },
  switchAction: { color: colors.violetLight, fontWeight: '600' },
});

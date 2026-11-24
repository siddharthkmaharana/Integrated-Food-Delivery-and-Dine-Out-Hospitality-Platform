import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from "@/api/client";
import { appParams } from '@/lib/app-params';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem("token");
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(hasToken);
    const [isLoadingAuth, setIsLoadingAuth] = useState(hasToken);
    const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [appPublicSettings, setAppPublicSettings] = useState({ id: 'local', public_settings: {} });

    useEffect(() => {
        checkAppState();
    }, []);

    const checkAppState = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoadingAuth(false);
            return;
        }
        try {
            setAuthError(null);
            await checkUserAuth();
        } catch (error) {
            console.error('Unexpected error:', error);
            setAuthError({
                type: 'unknown',
                message: error.message || 'An unexpected error occurred'
            });
            setIsLoadingAuth(false);
        }
    };

    const checkUserAuth = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoadingAuth(false);
            return;
        }
        try {
            setIsLoadingAuth(true);
            const currentUser = await api.auth.me();
            if (currentUser) {
                setUser(currentUser);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
            setIsLoadingAuth(false);
        } catch (error) {
            console.error('User auth check failed:', error);
            setIsLoadingAuth(false);
            setIsAuthenticated(false);

            if (error.status === 401 || error.status === 403) {
                setAuthError({
                    type: 'auth_required',
                    message: 'Authentication required'
                });
            }
        }
    };

    const logout = (shouldRedirect = true) => {
        setUser(null);
        setIsAuthenticated(false);

        if (shouldRedirect) {
            // Use the SDK's logout method which handles token cleanup and redirect
            api.auth.logout(window.location.href);
        } else {
            // Just remove the token without redirect
            api.auth.logout();
        }
    };

    const navigateToLogin = () => {
        // Use the SDK's redirectToLogin method
        api.auth.redirectToLogin(window.location.href);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoadingAuth,
            isLoadingPublicSettings,
            authError,
            appPublicSettings,
            logout,
            navigateToLogin,
            checkAppState
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useMutation, useLazyQuery, gql } from '@apollo/client';
import { LOGIN } from '../graphql/mutations';

const ME = gql`
  query Me {
    me {
      id
      email
      username
      firstName
      lastName
      role
      status
      lastLogin
      createdAt
      updatedAt
    }
  }
`;

interface User {
    id: string;
    email: string;
    name?: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [loginMutation] = useMutation(LOGIN);
    const [fetchMe, { data: meData }] = useLazyQuery(ME);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('accessToken');
        if (token) {
            setIsAuthenticated(true);
            // Fetch user profile from backend
            fetchMe();
        }
        setLoading(false);
    }, [fetchMe]);

    useEffect(() => {
        if (meData && meData.me) {
            setUser({
                id: meData.me.id,
                email: meData.me.email,
                name: meData.me.firstName ? `${meData.me.firstName} ${meData.me.lastName || ''}`.trim() : meData.me.username
            });
        }
    }, [meData]);

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            setLoading(true);
            const response = await loginMutation({
                variables: { email, password }
            });

            if (response.data?.login?.accessToken) {
                localStorage.setItem('accessToken', response.data.login.accessToken);
                setIsAuthenticated(true);
                setUser({ id: '', email }); // id will be set after fetchMe
                return true;
            } else {
                setIsAuthenticated(false);
                setUser(null);
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            setIsAuthenticated(false);
            setUser(null);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        setIsAuthenticated(false);
        setUser(null);
    };

    const value = {
        isAuthenticated,
        user,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 
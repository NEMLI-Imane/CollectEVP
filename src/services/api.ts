const API_URL = 'http://127.0.0.1:8080/api';

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    division?: string;
  };
}

export interface ApiError {
  error?: string;
  message?: string;
  detail?: string;
  type?: string;
  title?: string;
  status?: number;
}

// Fonction pour obtenir le token depuis le localStorage
export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Fonction pour stocker le token
export const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Fonction pour supprimer le token
export const removeToken = (): void => {
  localStorage.removeItem('auth_token');
};

// Fonction pour faire des requêtes API avec authentification
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Une erreur est survenue');
  }

  return response;
};

// Fonction de connexion - Authentification réelle via le backend
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  console.log('🔐 Tentative de connexion pour:', email);
  
  // Créer un AbortController pour gérer le timeout
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
    controller.abort();
    timeoutId = null;
  }, 10000); // 10 secondes de timeout
  
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      signal: controller.signal, // Ajouter le signal pour le timeout
    });

    if (timeoutId) {
      clearTimeout(timeoutId); // Annuler le timeout si la requête réussit
      timeoutId = null;
    }
    console.log('📡 Réponse reçue:', response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = 'Email ou mot de passe incorrect';
      
      try {
        const errorData: ApiError = await response.json();
        console.error('❌ Erreur API complète:', errorData);
        console.error('❌ Status:', response.status);
        
        // Gérer les erreurs spécifiques
        if (errorData.detail) {
          if (errorData.detail.includes('could not find driver')) {
            errorMessage = 'Extension PostgreSQL non installée. Vérifiez la configuration PHP.';
          } else if (errorData.detail.includes('Connection refused') || errorData.detail.includes('could not connect')) {
            errorMessage = 'Impossible de se connecter à la base de données. Vérifiez que PostgreSQL est démarré.';
          } else {
            errorMessage = errorData.detail;
          }
        } else {
          // JWTAuthenticationFailureResponse retourne { message: "..." }
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
      } catch (parseError) {
        // Si la réponse n'est pas du JSON, utiliser le message d'erreur HTTP
        console.error('❌ Erreur de parsing:', parseError);
        console.error('❌ Status:', response.status);
        console.error('❌ StatusText:', response.statusText);
        
        if (response.status === 401) {
          errorMessage = 'Email ou mot de passe incorrect';
        } else if (response.status === 0) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend Symfony est démarré sur http://localhost:8080';
        } else if (response.status >= 500) {
          errorMessage = 'Erreur serveur. Vérifiez les logs du backend.';
        } else {
          errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Content-Type invalide:', contentType);
      throw new Error('Réponse invalide du serveur');
    }

    const data: LoginResponse = await response.json();
    console.log('📦 Données reçues:', data);
    
    if (!data.token || !data.user) {
      console.error('❌ Données manquantes dans la réponse:', data);
      throw new Error('Réponse invalide: données manquantes');
    }

    console.log('✅ Connexion réussie:', data);
    
    // Stocker le token et les données utilisateur
    setToken(data.token);
    localStorage.setItem('user_data', JSON.stringify(data.user));
    console.log('💾 Token et données utilisateur stockés');
    
    return data;
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId); // Nettoyer le timeout en cas d'erreur
      timeoutId = null;
    }
    
    // Gérer les erreurs de timeout
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ Timeout: Le serveur ne répond pas dans les 10 secondes');
      throw new Error('Le serveur ne répond pas. Vérifiez que le backend est démarré sur http://127.0.0.1:8080');
    }
    
    // Gérer les erreurs réseau (CORS, connexion refusée, etc.)
    if (error instanceof TypeError) {
      console.error('❌ Erreur réseau:', error);
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur http://127.0.0.1:8080');
      }
      throw new Error('Erreur de connexion réseau. Vérifiez votre connexion internet et que le backend est accessible.');
    }
    
    // Répercuter les autres erreurs
    throw error;
  }
};

// Fonction pour obtenir les informations de l'utilisateur connecté
export const getCurrentUser = async (): Promise<LoginResponse['user']> => {
  const token = getToken();
  
  if (!token) {
    throw new Error('Non authentifié');
  }

  // Si c'est un token fake (utilisé temporairement par le backend), utiliser les données du localStorage
  if (token.startsWith('fake-jwt-token-')) {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log('Données utilisateur récupérées depuis localStorage (token fake):', user);
        return user;
      } catch (e) {
        console.error('Erreur de parsing des données utilisateur:', e);
      }
    }
    // Si pas de données en localStorage, essayer quand même l'API
  }

  // Récupérer les données depuis l'API
  try {
    const response = await apiRequest('/me');
    const data = await response.json();
    console.log('Données utilisateur récupérées depuis API:', data);
    
    // Mettre à jour le localStorage avec les données réelles
    localStorage.setItem('user_data', JSON.stringify(data));
    
    return data;
  } catch (error) {
    // Si l'API échoue mais qu'on a un token fake, utiliser les données du localStorage
    if (token.startsWith('fake-jwt-token-')) {
      const storedUser = localStorage.getItem('user_data');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          console.log('Utilisation des données localStorage après échec API:', user);
          return user;
        } catch (e) {
          // Ignorer
        }
      }
    }
    // En cas d'erreur (token invalide, expiré, etc.), nettoyer et lever l'erreur
    removeToken();
    localStorage.removeItem('user_data');
    throw error;
  }
};

// Fonction de déconnexion
export const logout = (): void => {
  removeToken();
  localStorage.removeItem('user_data');
};

// Interface pour un employé
export interface Employee {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  poste: string;
  service: string;
  division: string;
}

// Fonction pour obtenir tous les employés
export const getEmployees = async (): Promise<Employee[]> => {
  const response = await apiRequest('/employees');
  const data = await response.json();
  console.log('Réponse API /employees:', data);
  // S'assurer que c'est un tableau
  if (Array.isArray(data)) {
    return data;
  }
  // Si c'est un objet, essayer de trouver un tableau dedans
  if (data && typeof data === 'object') {
    console.warn('La réponse API n\'est pas un tableau:', data);
    return [];
  }
  return [];
};

// Fonction pour créer un employé
export const createEmployee = async (employee: Omit<Employee, 'id'>): Promise<Employee> => {
  const response = await apiRequest('/employees', {
    method: 'POST',
    body: JSON.stringify(employee),
  });
  const data = await response.json();
  return data;
};

// Fonction pour mettre à jour un employé
export const updateEmployee = async (id: number, employee: Partial<Omit<Employee, 'id'>>): Promise<Employee> => {
  const response = await apiRequest(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(employee),
  });
  const data = await response.json();
  return data;
};

// Fonction pour supprimer un employé
export const deleteEmployee = async (id: number): Promise<void> => {
  await apiRequest(`/employees/${id}`, {
    method: 'DELETE',
  });
};


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

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Important pour CORS avec credentials
    });

    if (!response.ok) {
      let errorMessage = 'Une erreur est survenue';
      try {
        const error: ApiError = await response.json();
        errorMessage = error.error || error.message || error.detail || `Erreur ${response.status}: ${response.statusText}`;
        console.error('❌ Erreur API:', {
          status: response.status,
          statusText: response.statusText,
          error: error
        });
      } catch (e) {
        errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        console.error('❌ Erreur API (pas de JSON):', response.status, response.statusText);
      }
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    // Gérer les erreurs réseau (CORS, timeout, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur http://127.0.0.1:8080');
    }
    throw error;
  }
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
      credentials: 'include', // Important pour CORS
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

// Interface pour une entité Prime
export interface Prime {
  id?: number;
  tauxMonetaire?: string | number;
  groupe?: number;
  nombrePostes?: number;
  scoreEquipe?: number;
  noteHierarchique?: number;
  scoreCollectif?: number;
  montantCalcule?: string | number;
  statut?: string;
  submittedAt?: string;
  commentaire?: string;
}

// Interface pour une entité Conge
export interface Conge {
  id?: number;
  dateDebut?: string;
  dateFin?: string;
  nombreJours?: number;
  tranche?: number;
  avanceSurConge?: boolean;
  montantAvance?: string | number;
  indemniteForfaitaire?: string | number;
  indemniteCalculee?: string | number;
  statut?: string;
  submittedAt?: string;
  commentaire?: string;
}

// Interface pour une soumission EVP
export interface EVPSubmission {
  id: number;
  employee: Employee;
  submittedBy?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
  isPrime: boolean; // New boolean field
  isConge: boolean; // New boolean field
  prime?: Prime; // Relation to Prime entity
  conge?: Conge; // Relation to Conge entity
  montantCalcule?: string | number;
  indemniteCalculee?: string | number;
  valideService?: boolean;
  valideDivision?: boolean;
  // Champs dépréciés (pour compatibilité avec l'ancien format)
  type?: string;
  tauxMonetaire?: string | number;
  groupe?: number;
  nombrePostes?: number;
  scoreEquipe?: number;
  noteHierarchique?: number;
  scoreCollectif?: number;
  dateDebut?: string;
  dateFin?: string;
  nombreJours?: number;
  tranche?: number;
  avanceSurConge?: boolean;
  montantAvance?: string | number;
  indemniteForfaitaire?: string | number;
}

// Fonction pour obtenir les soumissions EVP
export const getEVPSubmissions = async (): Promise<EVPSubmission[]> => {
  try {
    console.log('📤 Récupération des soumissions EVP...');
    const response = await apiRequest('/evp/submissions');
    const data = await response.json();
    console.log('✅ Soumissions EVP reçues:', data);
    
    if (Array.isArray(data)) {
      return data;
    }
    
    // Si ce n'est pas un tableau, logger et retourner un tableau vide
    console.warn('⚠️ La réponse n\'est pas un tableau:', data);
    return [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des soumissions EVP:', error);
    // Retourner un tableau vide au lieu de lever une erreur pour permettre la continuation
    return [];
  }
};

// Fonction pour créer une soumission EVP (ajouter un employé au tableau)
export const createEVPSubmission = async (employeeId: number, type: 'Prime' | 'Congé' | 'En attente' = 'En attente'): Promise<EVPSubmission> => {
  console.log('📤 Création d\'une soumission EVP:', { employeeId, type });
  
  try {
    const response = await apiRequest('/evp/submissions', {
      method: 'POST',
      body: JSON.stringify({
        employeeId,
        type, // 'Prime' ou 'Congé' pour créer immédiatement l'entité correspondante
      }),
    });
    
    const data = await response.json();
    console.log('✅ Soumission EVP créée avec succès:', data);
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la création de la soumission EVP:', error);
    throw error;
  }
};

// Fonction pour mettre à jour une soumission EVP (sauvegarder Prime/Congé)
export const updateEVPSubmission = async (submissionId: number, data: Partial<EVPSubmission>): Promise<EVPSubmission> => {
  console.log('📤 Mise à jour de la soumission EVP:', { submissionId, data });

  try {
    const response = await apiRequest(`/evp/submissions/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    const updatedData = await response.json();
    console.log('✅ Soumission EVP mise à jour avec succès:', updatedData);
    return updatedData;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la soumission EVP:', error);
    throw error;
  }
};

export const deleteEVPSubmission = async (submissionId: number, type: 'Prime' | 'Congé'): Promise<void> => {
  console.log('📤 Suppression d\'une soumission EVP:', { submissionId, type });

  try {
    const response = await apiRequest(`/evp/submissions/${submissionId}`, {
      method: 'DELETE',
      body: JSON.stringify({ type }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
      throw new Error(errorData.error || errorData.message || 'Erreur lors de la suppression');
    }

    console.log('✅ Soumission EVP supprimée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la soumission EVP:', error);
    throw error;
  }
};

// Employee Request interfaces
export interface EmployeeRequest {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  raison: string;
  requestedBy: {
    id: number;
    name: string;
    email: string;
  };
  requestDate: string;
  processedBy?: {
    id: number;
    name: string;
    email: string;
  } | null;
  processedDate?: string | null;
  statut: 'En attente' | 'Traité' | 'Rejeté';
}

// Create employee request
export const createEmployeeRequest = async (data: {
  matricule: string;
  nom: string;
  prenom: string;
  raison: string;
}): Promise<EmployeeRequest> => {
  console.log('📤 Création d\'une demande d\'employé:', data);

  try {
    const response = await apiRequest('/employee-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
      throw new Error(errorData.error || errorData.message || 'Erreur lors de la création de la demande');
    }

    const result = await response.json();
    console.log('✅ Demande d\'employé créée avec succès');
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la création de la demande d\'employé:', error);
    throw error;
  }
};

// Get all employee requests (for RH)
export const getEmployeeRequests = async (): Promise<EmployeeRequest[]> => {
  console.log('📤 Récupération des demandes d\'employé...');

  try {
    const response = await apiRequest('/employee-requests', {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
      throw new Error(errorData.error || errorData.message || 'Erreur lors de la récupération des demandes');
    }

    const result = await response.json();
    console.log('✅ Demandes d\'employé récupérées avec succès');
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des demandes d\'employé:', error);
    throw error;
  }
};

// Process employee request (approve or reject)
export const processEmployeeRequest = async (
  requestId: number,
  action: 'approve' | 'reject',
  additionalData?: {
    poste: string;
    service: string;
    division: string;
  }
): Promise<any> => {
  console.log('📤 Traitement d\'une demande d\'employé:', { requestId, action, additionalData });

  try {
    const body: any = { action };
    if (action === 'approve' && additionalData) {
      body.poste = additionalData.poste;
      body.service = additionalData.service;
      body.division = additionalData.division;
    }

    const response = await apiRequest(`/employee-requests/${requestId}/process`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
      throw new Error(errorData.error || errorData.message || 'Erreur lors du traitement de la demande');
    }

    const result = await response.json();
    console.log('✅ Demande d\'employé traitée avec succès');
    return result;
  } catch (error) {
    console.error('❌ Erreur lors du traitement de la demande d\'employé:', error);
    throw error;
  }
};

// Validate or reject EVP submission (for Responsable Service or Division)
export const validateEVPSubmission = async (
  submissionId: number,
  action: 'approve' | 'reject',
  data?: {
    niveau: 'service' | 'division';
    commentaire?: string;
    type?: 'Prime' | 'Congé';
  }
): Promise<any> => {
  console.log('📤 Validation/Rejet d\'une soumission EVP:', { submissionId, action, data });

  try {
    const body: any = { action, niveau: data?.niveau || 'service' };
    if (data?.commentaire) {
      body.commentaire = data.commentaire;
    }
    if (data?.type) {
      body.type = data.type;
    }

    const response = await apiRequest(`/evp/submissions/${submissionId}/validate`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
      throw new Error(errorData.error || errorData.message || 'Erreur lors de la validation');
    }

    const result = await response.json();
    console.log('✅ Soumission EVP validée/rejetée avec succès');
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la validation de la soumission EVP:', error);
    throw error;
  }
};

// User management interfaces
export interface SystemUser {
  id: number;
  name: string;
  email: string;
  role: string;
  division?: string;
  status: 'active' | 'inactive';
}

// Get all users
export const getUsers = async (): Promise<SystemUser[]> => {
  console.log('📤 Récupération des utilisateurs...');

  try {
    const response = await apiRequest('/users', {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
      throw new Error(errorData.error || errorData.message || 'Erreur lors de la récupération des utilisateurs');
    }

    const result = await response.json();
    console.log('✅ Utilisateurs récupérés avec succès');
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
};

// Create user
export const createUser = async (data: {
  name: string;
  email: string;
  role: string;
  division?: string;
  password?: string;
}): Promise<SystemUser> => {
  console.log('📤 Création d\'un utilisateur:', data);

  try {
    const response = await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
      throw new Error(errorData.error || errorData.message || 'Erreur lors de la création de l\'utilisateur');
    }

    const result = await response.json();
    console.log('✅ Utilisateur créé avec succès');
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
    throw error;
  }
};

// Update user
export const updateUser = async (id: number, data: Partial<SystemUser & { password?: string }>): Promise<SystemUser> => {
  console.log('📤 Mise à jour d\'un utilisateur:', { id, data });

  try {
    const response = await apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
      throw new Error(errorData.error || errorData.message || 'Erreur lors de la mise à jour de l\'utilisateur');
    }

    const result = await response.json();
    console.log('✅ Utilisateur mis à jour avec succès');
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'utilisateur:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (id: number): Promise<void> => {
  console.log('📤 Suppression d\'un utilisateur:', id);

  try {
    const response = await apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
      throw new Error(errorData.error || errorData.message || 'Erreur lors de la suppression de l\'utilisateur');
    }

    console.log('✅ Utilisateur supprimé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'utilisateur:', error);
    throw error;
  }
};


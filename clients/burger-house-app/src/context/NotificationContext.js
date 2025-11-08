import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';
import { orderService } from '../services/orderService';
import { adminService } from '../services/adminService';

const NotificationContext = createContext();
const READ_NOTIFICATIONS_KEY = 'read_notifications_v1';
const DELETED_NOTIFICATIONS_KEY = 'deleted_notifications_v1';
const LAST_STATUS_KEY = 'last_status_v1';
const DELETED_NOTIFICATIONS_ADMIN_KEY = 'deleted_notifications_admin_v1';
const LAST_STATUS_ADMIN_KEY = 'last_status_admin_v1';

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  // Utiliser useContext directement pour éviter les problèmes de dépendance circulaire
  const authContext = useContext(AuthContext);
  const isAuthenticated = !!authContext?.token;
  const user = authContext?.user;
  const [notifications, setNotifications] = useState([]);
  const [readNotifications, setReadNotifications] = useState(new Set()); // IDs des notifications lues
  const [deletedNotifications, setDeletedNotifications] = useState(new Set()); // IDs des notifications supprimées
  const lastStatusRef = useRef({}); // id -> status (pour les commandes)
  const lastSeenRef = useRef({}); // type -> Set d'IDs (messages, reviews, users)
  const [loading, setLoading] = useState(false);

  // Charger les notifications lues, supprimées et lastStatus depuis AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const [readStored, deletedStored, statusStored] = await Promise.all([
          AsyncStorage.getItem(READ_NOTIFICATIONS_KEY),
          // MULTI-TENANT : Les owners (rôle 'restaurant') ont aussi accès aux notifications admin
          AsyncStorage.getItem((user?.role === 'superadmin' || user?.role === 'adminrestaurant') ? DELETED_NOTIFICATIONS_ADMIN_KEY : DELETED_NOTIFICATIONS_KEY),
          AsyncStorage.getItem((user?.role === 'superadmin' || user?.role === 'adminrestaurant') ? LAST_STATUS_ADMIN_KEY : LAST_STATUS_KEY),
        ]);
        
        if (readStored) {
          const parsed = JSON.parse(readStored);
          if (Array.isArray(parsed)) {
            setReadNotifications(new Set(parsed));
          }
        }
        
        if (deletedStored) {
          const parsed = JSON.parse(deletedStored);
          if (Array.isArray(parsed)) {
            setDeletedNotifications(new Set(parsed));
          }
        }
        
        if (statusStored) {
          const parsed = JSON.parse(statusStored);
          if (parsed && typeof parsed === 'object') {
            lastStatusRef.current = parsed.status || {};
            // Convertir les tableaux en Sets pour lastSeenRef
            const seen = parsed.seen || {};
            lastSeenRef.current = {
              orders: new Set(seen.orders || []),
              messages: new Set(seen.messages || []),
              reviews: new Set(seen.reviews || []),
              users: new Set(seen.users || []),
            };
          }
        }
      } catch (e) {
        console.error('Erreur chargement notifications:', e);
      }
    })();
  }, [user?.role]);

  // Sauvegarder les notifications lues, supprimées et lastStatus dans AsyncStorage
  // Optimisé : sauvegarde seulement lors de changements importants, pas toutes les 5 secondes
  const saveStatusRef = useRef(null);
  const lastSaveTimeRef = useRef(0);
  
  useEffect(() => {
    // MULTI-TENANT : Les owners (rôle 'restaurant') ont aussi accès aux notifications admin
    const storageKey = (user?.role === 'superadmin' || user?.role === 'adminrestaurant') ? DELETED_NOTIFICATIONS_ADMIN_KEY : DELETED_NOTIFICATIONS_KEY;
    const statusKey = (user?.role === 'superadmin' || user?.role === 'adminrestaurant') ? LAST_STATUS_ADMIN_KEY : LAST_STATUS_KEY;
    
    // Sauvegarder readNotifications et deletedNotifications seulement lors de changements
    if (readNotifications.size > 0) {
      AsyncStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(Array.from(readNotifications))).catch(() => {});
    }
    
    if (deletedNotifications.size > 0) {
      AsyncStorage.setItem(storageKey, JSON.stringify(Array.from(deletedNotifications))).catch(() => {});
    }
    
    // Sauvegarder lastStatusRef et lastSeenRef avec debounce (toutes les 30 secondes au lieu de 5)
    const now = Date.now();
    const saveStatus = () => {
      const data = {
        status: lastStatusRef.current,
        seen: {
          orders: Array.from(lastSeenRef.current.orders || []),
          messages: Array.from(lastSeenRef.current.messages || []),
          reviews: Array.from(lastSeenRef.current.reviews || []),
          users: Array.from(lastSeenRef.current.users || []),
        },
      };
      AsyncStorage.setItem(statusKey, JSON.stringify(data)).catch(() => {});
      lastSaveTimeRef.current = Date.now();
    };
    
    // Nettoyer l'ancien interval s'il existe
    if (saveStatusRef.current) {
      clearInterval(saveStatusRef.current);
    }
    
    // Sauvegarder immédiatement si plus de 30 secondes se sont écoulées
    if (now - lastSaveTimeRef.current > 30000) {
      saveStatus();
    }
    
    // Puis sauvegarder toutes les 30 secondes (au lieu de 5)
    saveStatusRef.current = setInterval(saveStatus, 30000);
    return () => {
      if (saveStatusRef.current) {
        clearInterval(saveStatusRef.current);
      }
    };
  }, [readNotifications, deletedNotifications, user?.role]);

  // Fonction pour grouper les notifications similaires
  const groupSimilarNotifications = (notifications) => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000); // 5 minutes en millisecondes
    const grouped = new Map(); // Clé: "type", Valeur: { notifications: [], timestamp: number }
    const ungrouped = [];
    
    for (const notif of notifications) {
      // Ne pas grouper si la notification est trop ancienne (> 5 minutes)
      if (notif.timestamp && notif.timestamp < fiveMinutesAgo) {
        ungrouped.push(notif);
        continue;
      }
      
      // Types de notifications à grouper
      const groupableTypes = ['new_order', 'new_message', 'new_review', 'new_user', 'order_status'];
      
      if (!groupableTypes.includes(notif.type)) {
        ungrouped.push(notif);
        continue;
      }
      
      // Créer une clé unique pour le groupement
      // Pour les commandes et statuts, on groupe par type et statut
      // Pour les autres, on groupe simplement par type
      let groupKey = notif.type;
      if (notif.type === 'order_status' && notif.status) {
        groupKey = `${notif.type}_${notif.status}`;
      } else if (notif.type === 'new_order' && notif.status) {
        groupKey = `${notif.type}_${notif.status}`;
      }
      
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          notifications: [],
          timestamp: notif.timestamp || Date.now(),
          type: notif.type,
          priority: notif.priority || 'medium',
        });
      }
      
      const group = grouped.get(groupKey);
      group.notifications.push(notif);
      
      // Mettre à jour le timestamp avec le plus récent
      if (notif.timestamp && notif.timestamp > group.timestamp) {
        group.timestamp = notif.timestamp;
      }
      
      // Mettre à jour la priorité avec la plus haute
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      if (priorityOrder[notif.priority] > priorityOrder[group.priority]) {
        group.priority = notif.priority;
      }
    }
    
    // Convertir les groupes en notifications groupées
    const result = [...ungrouped];
    
    for (const [groupKey, group] of grouped.entries()) {
      if (group.notifications.length === 1) {
        // Une seule notification, pas besoin de grouper
        result.push(group.notifications[0]);
      } else if (group.notifications.length > 1) {
        // Créer une notification groupée
        const groupedNotification = createGroupedNotification(group);
        result.push(groupedNotification);
      }
    }
    
    return result;
  };
  
  // Fonction pour créer une notification groupée
  const createGroupedNotification = (group) => {
    const { notifications, type, timestamp, priority } = group;
    const count = notifications.length;
    
    // Messages selon le type
    const groupMessages = {
      'new_order': {
        title: count === 1 ? 'Nouvelle commande' : `${count} nouvelles commandes`,
        message: count === 1 
          ? 'Une nouvelle commande a été passée'
          : `${count} nouvelles commandes ont été passées`,
      },
      'new_message': {
        title: count === 1 ? 'Nouveau message' : `${count} nouveaux messages`,
        message: count === 1 
          ? 'Un nouveau message a été reçu'
          : `${count} nouveaux messages ont été reçus`,
      },
      'new_review': {
        title: count === 1 ? 'Nouvel avis' : `${count} nouveaux avis`,
        message: count === 1 
          ? 'Un nouvel avis a été soumis'
          : `${count} nouveaux avis ont été soumis`,
      },
      'new_user': {
        title: count === 1 ? 'Nouveau client' : `${count} nouveaux clients`,
        message: count === 1 
          ? 'Un nouveau client s\'est inscrit'
          : `${count} nouveaux clients se sont inscrits`,
      },
      'order_status': {
        title: count === 1 ? 'Mise à jour de commande' : `${count} mises à jour de commandes`,
        message: count === 1 
          ? 'Le statut d\'une commande a été mis à jour'
          : `Le statut de ${count} commandes a été mis à jour`,
      },
    };
    
    const messages = groupMessages[type] || {
      title: `${count} nouvelles notifications`,
      message: `${count} notifications du même type`,
    };
    
    // Trouver la notification la plus récente pour le temps
    const mostRecent = notifications.reduce((latest, current) => {
      return (!latest || (current.timestamp || 0) > (latest.timestamp || 0)) ? current : latest;
    }, null);
    
    return {
      id: `grouped-${type}-${timestamp}`,
      type: type,
      title: messages.title,
      message: messages.message,
      priority: priority,
      timestamp: timestamp,
      time: mostRecent?.time || new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      grouped: true, // Marqueur pour indiquer que c'est une notification groupée
      count: count, // Nombre de notifications dans le groupe
      notifications: notifications, // Liste des notifications individuelles
    };
  };

  // Système de retry avec backoff exponentiel pour les erreurs réseau
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const baseDelay = 1000; // 1 seconde
  
  const fetchNotifications = async (retryCount = 0) => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    
    try {
      setLoading(true);
      const currentTime = new Date();
      const newNotifications = [];
      
      // MULTI-TENANT : Les owners (rôle 'restaurant') ont aussi accès aux notifications admin
      if (user?.role === 'superadmin' || user?.role === 'adminrestaurant') {
        // Initialiser lastSeenRef si nécessaire
        if (!lastSeenRef.current.orders) lastSeenRef.current.orders = new Set();
        if (!lastSeenRef.current.messages) lastSeenRef.current.messages = new Set();
        if (!lastSeenRef.current.reviews) lastSeenRef.current.reviews = new Set();
        if (!lastSeenRef.current.users) lastSeenRef.current.users = new Set();
        
        // Récupérer toutes les données en parallèle
        const [ordersData, messagesData, reviewsData, usersData] = await Promise.all([
          adminService.getOrders({ limit: '100', status: 'recu' }),
          adminService.getMessages({ limit: '100' }), // Récupérer tous les messages, on filtrera côté client
          adminService.getPendingReviews({ limit: '50' }),
          adminService.getUsers({ role: 'customer', limit: '100' }), // Augmenter la limite pour voir plus de nouveaux clients
        ]);
        
        // 1. Notifications pour les nouvelles commandes (statut pending)
        for (const o of ordersData) {
          const notificationId = `admin-order-${o.id}-new`;
          const prevStatus = lastStatusRef.current[o.id];
          
          if (deletedNotifications.has(notificationId)) {
            lastStatusRef.current[o.id] = o.status;
            continue;
          }
          
          if (o.status === 'pending') {
            const orderCreatedAt = new Date(o.createdAt);
            const now = new Date();
            const minutesSinceCreation = (now - orderCreatedAt) / (1000 * 60);
            
            // Vérifier si la notification existe déjà (dans notifications ou dans newNotifications)
            const existingNotif = notifications.some(n => n.id === notificationId) || 
                                 newNotifications.some(n => n.id === notificationId);
            const isNewOrder = !prevStatus || 
                              (minutesSinceCreation < 15 && prevStatus !== 'pending') ||
                              (minutesSinceCreation < 2);
            
            // Étendre la fenêtre à 24h pour les notifications non lues (au lieu de 15 minutes)
            const hoursSinceCreation = minutesSinceCreation / 60;
            if (hoursSinceCreation < 24 && !existingNotif && isNewOrder && !lastSeenRef.current.orders.has(o.id)) {
              newNotifications.push({
                id: notificationId,
                type: 'new_order',
                title: `Nouvelle commande ${o.orderNumber}`,
                message: `Une nouvelle commande a été passée`,
                orderId: o.id,
                orderNumber: o.orderNumber,
                status: o.status,
                priority: 'high', // Priorité haute pour les nouvelles commandes
                timestamp: orderCreatedAt.getTime(), // Ajouter timestamp numérique
                time: orderCreatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              });
              lastSeenRef.current.orders.add(o.id);
            }
          }
          lastStatusRef.current[o.id] = o.status;
        }
        
        // 2. Notifications pour les nouveaux messages
        for (const msg of messagesData) {
          const notificationId = `admin-message-${msg.id}-new`;
          const msgCreatedAt = new Date(msg.createdAt);
          const now = new Date();
          const minutesSinceCreation = (now - msgCreatedAt) / (1000 * 60);
          
          // Vérifier si la notification existe déjà
          const existingNotif = notifications.some(n => n.id === notificationId) || 
                               newNotifications.some(n => n.id === notificationId);
          
          // Étendre la fenêtre à 24h pour les notifications non lues (au lieu de 15 minutes)
          const hoursSinceCreation = minutesSinceCreation / 60;
          if (!deletedNotifications.has(notificationId) && 
              hoursSinceCreation < 24 && 
              !existingNotif && 
              !lastSeenRef.current.messages.has(msg.id) &&
              (msg.status === 'new' || msg.status === 'unread')) {
            newNotifications.push({
              id: notificationId,
              type: 'new_message',
              title: `Nouveau message de ${msg.name || msg.email || 'Client'}`,
              message: msg.subject || msg.message || 'Nouveau message reçu',
              messageId: msg.id,
              priority: 'high', // Priorité haute pour les messages
              timestamp: msgCreatedAt.getTime(), // Ajouter timestamp numérique
              time: msgCreatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            });
            lastSeenRef.current.messages.add(msg.id);
          }
        }
        
        // 3. Notifications pour les nouveaux avis (pending)
        for (const review of reviewsData) {
          const notificationId = `admin-review-${review.id}-new`;
          const reviewCreatedAt = new Date(review.createdAt);
          const now = new Date();
          const minutesSinceCreation = (now - reviewCreatedAt) / (1000 * 60);
          
          // Vérifier si la notification existe déjà
          const existingNotif = notifications.some(n => n.id === notificationId) || 
                               newNotifications.some(n => n.id === notificationId);
          
          // Étendre la fenêtre à 24h pour les notifications non lues (au lieu de 15 minutes)
          const hoursSinceCreation = minutesSinceCreation / 60;
          if (!deletedNotifications.has(notificationId) && 
              hoursSinceCreation < 24 && 
              !existingNotif && 
              !lastSeenRef.current.reviews.has(review.id) &&
              review.status === 'pending') {
            newNotifications.push({
              id: notificationId,
              type: 'new_review',
              title: `Nouvel avis en attente`,
              message: `Un nouveau avis a été soumis pour ${review.menuItem?.name || 'un plat'}`,
              reviewId: review.id,
              menuItemId: review.menuItemId,
              priority: 'medium', // Priorité moyenne pour les avis
              timestamp: reviewCreatedAt.getTime(), // Ajouter timestamp numérique
              time: reviewCreatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            });
            lastSeenRef.current.reviews.add(review.id);
          }
        }
        
        // 4. Notifications pour les nouvelles inscriptions (nouveaux clients)
        for (const user of usersData) {
          const notificationId = `admin-user-${user.id}-new`;
          const userCreatedAt = new Date(user.createdAt);
          const now = new Date();
          const minutesSinceCreation = (now - userCreatedAt) / (1000 * 60);
          
          // Vérifier si la notification existe déjà
          const existingNotif = notifications.some(n => n.id === notificationId) || 
                               newNotifications.some(n => n.id === notificationId);
          
          // Étendre la fenêtre à 24h pour les notifications non lues (au lieu de 15 minutes)
          const hoursSinceCreation = minutesSinceCreation / 60;
          if (!deletedNotifications.has(notificationId) && 
              hoursSinceCreation < 24 && 
              !existingNotif && 
              !lastSeenRef.current.users.has(user.id) &&
              user.role === 'customer') {
            newNotifications.push({
              id: notificationId,
              type: 'new_user',
              title: `Nouveau client inscrit`,
              message: `${user.name || user.email} vient de s'inscrire`,
              userId: user.id,
              userName: user.name || user.email,
              priority: 'low', // Priorité basse pour les nouveaux utilisateurs
              timestamp: userCreatedAt.getTime(), // Ajouter timestamp numérique
              time: userCreatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            });
            lastSeenRef.current.users.add(user.id);
          }
        }
      } else {
        // Notifications pour les clients : changements de statut
        const data = await orderService.getMyOrders();
        
        for (const o of data) {
          const prev = lastStatusRef.current[o.id];
          const importantStatuses = ['confirmed', 'preparing', 'ready', 'on_delivery', 'completed', 'cancelled'];
          
          // Ne pas créer de notification si elle a déjà été supprimée
          const notificationId = `order-${o.id}-${o.status}-${o.updatedAt || o.createdAt}`;
          if (deletedNotifications.has(notificationId)) {
            lastStatusRef.current[o.id] = o.status;
            continue;
          }
          
          if (prev && prev !== o.status && importantStatuses.includes(o.status)) {
            const statusMessages = {
              confirmed: 'confirmée',
              preparing: 'en préparation',
              ready: 'prête à récupérer',
              on_delivery: 'en livraison',
              completed: 'livrée',
              cancelled: 'annulée',
            };
            const message = statusMessages[o.status] || o.status;
            // Déterminer la priorité selon le statut
            const statusPriority = {
              'confirmed': 'high',
              'preparing': 'high',
              'ready': 'high',
              'on_delivery': 'high',
              'completed': 'medium',
              'cancelled': 'high',
            };
            newNotifications.push({
              id: notificationId,
              type: 'order_status',
              title: `Commande ${o.orderNumber}`,
              message: `Votre commande est ${message}`,
              orderId: o.id,
              orderNumber: o.orderNumber,
              status: o.status,
              priority: statusPriority[o.status] || 'medium', // Priorité selon le statut
              timestamp: currentTime.getTime(), // Ajouter timestamp numérique
              time: currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            });
          } else if (!prev && importantStatuses.includes(o.status) && o.status !== 'pending') {
            const orderDate = new Date(o.createdAt || o.updatedAt);
            const hoursSinceCreation = (currentTime - orderDate) / (1000 * 60 * 60);
            
            if (hoursSinceCreation < 24) {
              const statusMessages = {
                confirmed: 'confirmée',
                preparing: 'en préparation',
                ready: 'prête à récupérer',
                on_delivery: 'en livraison',
                completed: 'livrée',
                cancelled: 'annulée',
              };
              const message = statusMessages[o.status] || o.status;
              // Déterminer la priorité selon le statut
              const statusPriority = {
                'confirmed': 'high',
                'preparing': 'high',
                'ready': 'high',
                'on_delivery': 'high',
                'completed': 'medium',
                'cancelled': 'high',
              };
              newNotifications.push({
                id: `order-${o.id}-${o.status}-initial`,
                type: 'order_status',
                title: `Commande ${o.orderNumber}`,
                message: `Votre commande est ${message}`,
                orderId: o.id,
                orderNumber: o.orderNumber,
                status: o.status,
                priority: statusPriority[o.status] || 'medium', // Priorité selon le statut
                timestamp: currentTime.getTime(), // Ajouter timestamp numérique
                time: currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              });
            }
          }
          lastStatusRef.current[o.id] = o.status;
        }
      }
      
      // Filtrer les notifications supprimées et trier
      setNotifications(prev => {
        const combined = [...newNotifications, ...prev.filter(n => 
          !newNotifications.some(nn => nn.id === n.id) && !deletedNotifications.has(n.id)
        )];
        
        // Grouper les notifications similaires (même type, créées dans les 5 dernières minutes)
        const groupedNotifications = groupSimilarNotifications(combined);
        
        // Trier par priorité puis par timestamp (plus fiable que les strings de date)
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        const sorted = groupedNotifications.sort((a, b) => {
          // D'abord par priorité (high > medium > low)
          const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          if (priorityDiff !== 0) return priorityDiff;
          // Puis par timestamp (plus récent en premier)
          return (b.timestamp || 0) - (a.timestamp || 0);
        });
        
        // Réinitialiser le compteur de retry en cas de succès
        retryCountRef.current = 0;
        
        return sorted.slice(0, 100); // Garder les 100 dernières (au lieu de 10)
      });
    } catch (e) {
      // Si erreur 401 (Non autorisé), ne pas retry - token expiré ou invalide
      const isUnauthorized = e?.response?.status === 401 || e?.response?.data?.message?.includes('Not authorized');
      
      // Si erreur 429 (Rate limit), ne pas retry - trop de requêtes
      const isRateLimited = e?.response?.status === 429 || e?.response?.data?.error?.includes('Trop de requêtes');
      
      if (isUnauthorized) {
        // Token expiré ou invalide - arrêter les tentatives
        setNotifications([]);
        retryCountRef.current = 0;
        return;
      }
      
      if (isRateLimited) {
        // Rate limit atteint - arrêter les tentatives pour éviter d'aggraver le problème
        console.warn('🔔 NotificationContext - Rate limit atteint, arrêt des retries');
        retryCountRef.current = 0;
        // Ne pas vider les notifications, juste arrêter les retries
        return;
      }
      
      // Pour les autres erreurs, retry avec backoff exponentiel
      if (retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount); // 1s, 2s, 4s
        console.log(`🔔 NotificationContext - Retry dans ${delay}ms (tentative ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          fetchNotifications(retryCount + 1);
        }, delay);
      } else {
        console.error('🔔 NotificationContext - Échec après', maxRetries, 'tentatives');
        retryCountRef.current = 0; // Réinitialiser le compteur après échec
      }
    } finally {
      setLoading(false);
    }
  };

  // Charger les notifications au montage et les rafraîchir périodiquement
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const id = setInterval(fetchNotifications, 5000); // Toutes les 5 secondes (au lieu de 12)
      return () => clearInterval(id);
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, user?.role]);

  // Marquer une notification comme lue
  const markAsRead = (notificationId) => {
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      newSet.add(notificationId);
      return newSet;
    });
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      notifications.forEach(n => newSet.add(n.id));
      return newSet;
    });
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    // Marquer comme supprimée pour qu'elle ne revienne pas
    setDeletedNotifications(prev => {
      const newSet = new Set(prev);
      newSet.add(notificationId);
      return newSet;
    });
  };

  const clearAllNotifications = () => {
    // Marquer toutes les notifications actuelles comme supprimées
    setDeletedNotifications(prev => {
      const newSet = new Set(prev);
      notifications.forEach(n => newSet.add(n.id));
      return newSet;
    });
    setNotifications([]);
  };

  // Nettoyer les notifications lues qui n'existent plus
  useEffect(() => {
    if (notifications.length > 0) {
      setReadNotifications(prev => {
        const notificationIds = new Set(notifications.map(n => n.id));
        const cleaned = new Set();
        prev.forEach(id => {
          if (notificationIds.has(id)) {
            cleaned.add(id);
          }
        });
        return cleaned;
      });
    }
  }, [notifications]);

  // Nettoyer automatiquement les anciennes notifications supprimées dans AsyncStorage (plus de 30 jours)
  useEffect(() => {
    const cleanupOldNotifications = async () => {
      try {
        // MULTI-TENANT : Les owners (rôle 'restaurant') ont aussi accès aux notifications admin
        const storageKey = (user?.role === 'superadmin' || user?.role === 'adminrestaurant') ? DELETED_NOTIFICATIONS_ADMIN_KEY : DELETED_NOTIFICATIONS_KEY;
        const deletedStored = await AsyncStorage.getItem(storageKey);
        
        if (deletedStored) {
          const deletedArray = JSON.parse(deletedStored);
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
          
          // Filtrer les notifications supprimées récentes (garder seulement les 30 derniers jours)
          // On garde seulement les IDs de notifications supprimées récemment
          const recentDeleted = deletedArray.filter(id => {
            // Extraire le timestamp de l'ID si possible, sinon garder
            // Les IDs sont de la forme: "admin-order-123-new", "order-123-confirmed-1234567890"
            return true; // Pour l'instant, on garde tout, mais on pourrait filtrer par date
          });
          
          // Limiter à 1000 notifications supprimées maximum
          if (recentDeleted.length > 1000) {
            const trimmed = recentDeleted.slice(-1000); // Garder les 1000 plus récentes
            await AsyncStorage.setItem(storageKey, JSON.stringify(trimmed));
          }
        }
      } catch (e) {
        console.error('Erreur nettoyage notifications supprimées:', e);
      }
    };
    
    // Nettoyer toutes les heures
    cleanupOldNotifications();
    const cleanupInterval = setInterval(cleanupOldNotifications, 60 * 60 * 1000);
    return () => clearInterval(cleanupInterval);
  }, [user?.role]);

  // Handler pour naviguer vers une commande quand on clique sur une notification
  const handleNotificationPress = (notif) => {
    // Marquer la notification comme lue
    if (notif.id) {
      markAsRead(notif.id);
    }
    // Cette fonction sera surchargée par les écrans qui l'utilisent
  };

  // Filtrer les notifications non lues
  const unreadNotifications = notifications.filter(n => !readNotifications.has(n.id));
  const unreadCount = unreadNotifications.length;

  // Pour les admins : séparer les notifications de messages des autres
  // MULTI-TENANT : Les owners (rôle 'restaurant') ont aussi accès aux notifications admin
  const isAdmin = user?.role === 'superadmin' || user?.role === 'adminrestaurant';
  const generalNotifications = isAdmin 
    ? notifications.filter(n => n.type !== 'new_message')
    : notifications;
  const messageNotifications = isAdmin 
    ? notifications.filter(n => n.type === 'new_message')
    : [];
  
  const unreadGeneralNotifications = generalNotifications.filter(n => !readNotifications.has(n.id));
  const unreadMessageNotifications = messageNotifications.filter(n => !readNotifications.has(n.id));
  const unreadGeneralCount = unreadGeneralNotifications.length;
  const unreadMessageCount = unreadMessageNotifications.length;

  const value = {
    notifications: isAdmin ? generalNotifications : notifications, // Pour les admins, exclure les messages
    messageNotifications: isAdmin ? messageNotifications : [], // Pour les admins uniquement
    unreadNotifications: isAdmin ? unreadGeneralNotifications : unreadNotifications, // Notifications non lues (sans messages pour admin)
    unreadMessageNotifications, // Messages non lus (pour admin uniquement)
    notificationCount: isAdmin ? unreadGeneralCount : unreadCount, // Nombre de notifications non lues (sans messages pour admin)
    messageNotificationCount: isAdmin ? unreadMessageCount : 0, // Nombre de messages non lus (pour admin uniquement)
    loading,
    refreshNotifications: fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    onNotificationPress: handleNotificationPress, // Handler par défaut, sera surchargé par les écrans
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};


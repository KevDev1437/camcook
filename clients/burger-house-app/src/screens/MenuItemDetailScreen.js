import { MaterialIcons } from '@expo/vector-icons';
import { useContext, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Footer from '../components/Footer';
import Header from '../components/Header';
import MenuItemActions from '../components/MenuItemActions';
import MenuItemDescription from '../components/MenuItemDescription';
import MenuItemHeader from '../components/MenuItemHeader';
import MenuItemImage from '../components/MenuItemImage';
import MenuItemOptions from '../components/MenuItemOptions';
import MenuItemQuestions from '../components/MenuItemQuestions';
import MenuItemReviews from '../components/MenuItemReviews';
import api from '../config/api';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';

const MenuItemDetailScreen = ({ route, navigation }) => {
  const { menuItemId, restaurantId } = route.params;
  const { user, logout } = useContext(AuthContext);
  const { addItem, count } = useCart();
  const { notifications, notificationCount, onNotificationPress, markAsRead, clearNotification } = useNotifications();

  // États
  const [menuItem, setMenuItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptionsList, setSelectedOptionsList] = useState([{}]);
  const [currentPortionIndex, setCurrentPortionIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [adding, setAdding] = useState(false);

  const clearSelections = () => {
    setSelectedOptionsList([{}]);
    setQuantity(1);
    setCurrentPortionIndex(0);
  };

  // Quand la quantité change, on réinitialise les sélections comme demandé
  const handleQuantityChange = (q) => {
    const qty = Math.max(1, q);
    setQuantity(qty);
    // Réinitialiser toutes les sélections et créer un tableau par portion
    setSelectedOptionsList(Array.from({ length: qty }, () => ({}) ));
    setCurrentPortionIndex(0);
  };

  // Boissons depuis le backend (afficher toutes les boissons)

  // Helpers pour normaliser les choix (comme dans MenuItemOptions)
  const getChoiceKey = (choice, optionId, idx) => {
    if (choice && typeof choice === 'object') {
      return (
        choice.id ?? choice.value ?? choice.key ?? choice.name ?? `${optionId}-choice-${idx}`
      );
    }
    return `${optionId}-${String(choice)}`;
  };

  const getChoiceValue = (choice) => {
    if (choice && typeof choice === 'object') {
      return choice.value ?? choice.id ?? choice.name ?? JSON.stringify(choice);
    }
    return choice;
  };

  const getChoiceLabel = (choice) => {
    if (choice && typeof choice === 'object') {
      return choice.label ?? choice.name ?? String(choice.value ?? choice.id ?? '');
    }
    return String(choice);
  };

  // Trouver le groupe d'options "Accompagnements" depuis le backend
  const accompOption = useMemo(() => {
    const list = Array.isArray(menuItem?.options) ? menuItem.options : [];
    return list.find((opt) => (opt?.name || '').toLowerCase().includes('accomp')) || null;
  }, [menuItem?.options]);

  const accompagnementsChoices = useMemo(() => {
    return Array.isArray(accompOption?.choices) ? accompOption.choices : [];
  }, [accompOption]);

  const toggleAccompagnement = (choice) => {
    const key = accompOption?.id ?? 'accompagnements';
    const value = getChoiceValue(choice);
    setSelectedOptionsList((prev) => {
      const next = prev.map((p) => ({ ...p }));
      const cur = next[currentPortionIndex] || {};
      const arr = Array.isArray(cur[key]) ? [...cur[key]] : [];
      const idx = arr.indexOf(value);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(value);
      next[currentPortionIndex] = { ...cur, [key]: arr };
      return next;
    });
  };

  // Groupe Boisson depuis le backend (afficher toutes les boissons)
  const boissonOption = useMemo(() => {
    const list = Array.isArray(menuItem?.options) ? menuItem.options : [];
    return list.find((opt) => (opt?.name || '').toLowerCase().includes('boisson')) || null;
  }, [menuItem?.options]);

  const drinksChoices = useMemo(() => {
    return Array.isArray(boissonOption?.choices) ? boissonOption.choices : [];
  }, [boissonOption]);

  // Helper pour obtenir le prix d'un choix (supporte format string et objet {name, price})
  const getChoicePrice = (choice, choicesList = []) => {
    if (!choice) return 0;
    // Si le choix est un objet avec un prix
    if (typeof choice === 'object' && typeof choice.price === 'number') {
      return choice.price;
    }
    // Chercher dans la liste des choix pour trouver le prix
    const choiceValue = typeof choice === 'object' ? (choice.name || choice.label || String(choice)) : String(choice);
    const foundChoice = choicesList.find(c => {
      const cName = typeof c === 'object' ? (c.name || c.label || String(c)) : String(c);
      return cName.toLowerCase() === choiceValue.toLowerCase();
    });
    if (foundChoice && typeof foundChoice === 'object' && typeof foundChoice.price === 'number') {
      return foundChoice.price;
    }
    return 0;
  };

  // Aperçu prix dynamique (client-side; utilise les prix depuis les options)
  const computedTotal = useMemo(() => {
    if (!menuItem) return 0;
    const base = Number(menuItem.price) || 0;
    let sum = 0;
    for (let i = 0; i < quantity; i++) {
      const opts = selectedOptionsList[i] || {};
      const accKey = accompOption?.id ?? 'accompagnements';
      const boissonKey = boissonOption?.id ?? 'boisson';
      
      // Calculer le prix total des accompagnements sélectionnés
      const selectedAccomps = Array.isArray(opts[accKey]) ? opts[accKey] : [];
      let accompTotal = 0;
      selectedAccomps.forEach(acc => {
        accompTotal += getChoicePrice(acc, accompagnementsChoices);
      });
      
      // Calculer le prix total des boissons sélectionnées
      const selectedDrinks = Array.isArray(opts[boissonKey]) ? opts[boissonKey] : [];
      let drinkPrice = 0;
      selectedDrinks.forEach(drink => {
        drinkPrice += getChoicePrice(drink, drinksChoices);
      });
      
      sum += base + accompTotal + drinkPrice;
    }
    return +sum.toFixed(2);
  }, [menuItem, selectedOptionsList, quantity, accompOption?.id, boissonOption?.id, accompagnementsChoices, drinksChoices]);

  const toggleDrink = (choice) => {
    if (!boissonOption) return;
    const key = boissonOption?.id ?? 'boisson';
    const value = getChoiceValue(choice);
    setSelectedOptionsList((prev) => {
      const next = prev.map((p) => ({ ...p }));
      const cur = next[currentPortionIndex] || {};
      const arr = Array.isArray(cur[key]) ? [...cur[key]] : [];
      const idx = arr.indexOf(value);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(value);
      next[currentPortionIndex] = { ...cur, [key]: arr };
      return next;
    });
  };

  

  // Calcul non conditionnel pour éviter de briser l'ordre des hooks
  const filteredOptions = useMemo(() => {
    const list = Array.isArray(menuItem?.options) ? menuItem.options : [];
    return list.filter((opt) => {
      const n = (opt?.name || '').toLowerCase();
      return !(n.includes('accomp') || n.includes('boisson'));
    });
  }, [menuItem?.options]);

  useEffect(() => {
    loadMenuItemData();
  }, [menuItemId]);

  // Debug léger: afficher les groupes d'options reçus
  useEffect(() => {
    if (menuItem?.options) {
      try {
        const names = menuItem.options.map((o) => o?.name).filter(Boolean);
        console.log('[MenuItemDetail] Option groups:', names);
      } catch (_) {}
    }
  }, [menuItem?.options]);

  const loadMenuItemData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les données du plat depuis le backend
      const response = await api.get(`/menus/${menuItemId}`);
      const data = response.data.data; // API retourne { success: true, data: {...} }
      
      // Formater les données du plat (normalisation robuste)
      // images peut être: tableau JSON, chaîne JSON, ou URL simple
      let normalizedImages = [];
      if (Array.isArray(data.images)) {
        normalizedImages = data.images;
      } else if (typeof data.images === 'string') {
        try {
          const parsed = JSON.parse(data.images);
          normalizedImages = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
        } catch (_) {
          // Pas un JSON, considérer comme URL unique
          normalizedImages = data.images ? [data.images] : [];
        }
      }

      // options peut être: tableau JSON (via Sequelize JSON), ou chaîne JSON
      let normalizedOptions = [];
      if (Array.isArray(data.options)) {
        normalizedOptions = data.options;
      } else if (typeof data.options === 'string') {
        try {
          const parsed = JSON.parse(data.options);
          normalizedOptions = Array.isArray(parsed) ? parsed : [];
        } catch (_) {
          normalizedOptions = [];
        }
      }

      const formattedMenuItem = {
        id: data.id,
        name: data.name,
        description: data.description || 'Aucune description disponible',
        longDescription: data.description || 'Aucune description disponible',
        price: parseFloat(data.price),
        images: normalizedImages,
        options: normalizedOptions,
        rating: data.rating || 0,
        ratingCount: data.ratingCount || 0,
      };
      
      setMenuItem(formattedMenuItem);

      // Récupérer les avis du plat
      try {
  const reviewsResponse = await api.get(`/reviews/menu-items/${menuItemId}`);
        setReviews(reviewsResponse.data.data || []);
      } catch (error) {
        console.log('Erreur lors du chargement des avis:', error);
        setReviews([]);
      }

      // Récupérer les questions du plat
      try {
  const questionsResponse = await api.get(`/questions/menu-items/${menuItemId}`);
        setQuestions(questionsResponse.data.data || []);
      } catch (error) {
        console.log('Erreur lors du chargement des questions:', error);
        setQuestions([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de charger le plat');
      setLoading(false);
    }
  };

  const handleOptionChange = (optionId, choice, type) => {
    setSelectedOptionsList((prev) => {
      const next = prev.map((p) => ({ ...p }));
      const cur = next[currentPortionIndex] || {};
      if (type === 'radio') {
        next[currentPortionIndex] = { ...cur, [optionId]: choice };
      } else if (type === 'checkbox') {
        const arr = Array.isArray(cur[optionId]) ? [...cur[optionId]] : [];
        const idx = arr.indexOf(choice);
        if (idx >= 0) arr.splice(idx, 1); else arr.push(choice);
        next[currentPortionIndex] = { ...cur, [optionId]: arr };
      }
      return next;
    });
  };

  const handleAddToCart = async () => {
    if (!menuItem) return;
    try {
      setAdding(true);
      const accKey = accompOption?.id ?? 'accompagnements';
      const boissonKey = boissonOption?.id ?? 'boisson';

      // Ajouter 1 ligne par portion pour permettre des options différentes
      for (let i = 0; i < quantity; i++) {
        const opts = selectedOptionsList[i] || {};
        const accompagnements = Array.isArray(opts[accKey]) ? opts[accKey] : [];
        const boissonArray = Array.isArray(opts[boissonKey]) ? opts[boissonKey] : [];
        // Envoyer toutes les boissons sélectionnées (peut être un tableau vide ou avec plusieurs boissons)
        const boisson = boissonArray.length > 0 ? boissonArray : null;

        const payload = {
          menuItemId: menuItem.id,
          quantity: 1,
          options: {
            accompagnements,
            boisson: boisson,
          },
        };

        const resp = await api.post('/cart/price-item', payload);
        if (!resp?.data?.success) throw new Error('Réponse invalide');
        const priced = resp.data.data;
        
        const itemToAdd = {
          id: menuItem.id,
          name: menuItem.name,
          price: priced.unitPrice,
          image: Array.isArray(menuItem.images) ? menuItem.images[0] : menuItem.images,
          options: priced.options,
          pricing: priced.pricing, // Stocker les détails de prix pour l'affichage
        };

        addItem(itemToAdd, 1);
      }
      Alert.alert('Succès', `${quantity} portion(s) de ${menuItem.name} ajoutée(s) au panier.`);
    } catch (e) {
      console.error('Erreur ajout panier/pricing:', e?.message || e);
      Alert.alert('Erreur', "Impossible d'ajouter au panier pour le moment.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <Header 
          onCart={() => navigation.navigate('Cart')} 
          cartCount={count} 
          notifications={notifications}
          notificationCount={notificationCount}
          onDeleteNotification={(notificationId) => {
            if (clearNotification) {
              clearNotification(notificationId);
            }
          }}
          onNotificationPress={(notif) => {
            // Marquer la notification comme lue
            if (notif.id && markAsRead) {
              markAsRead(notif.id);
            }
            if (notif.orderId) {
              // Naviguer vers la page de commandes avec l'orderId en paramètre
              navigation.navigate('Orders', { orderId: notif.orderId });
            } else {
              navigation.navigate('Orders');
            }
          }}
          onNotifications={() => {
            navigation.navigate('Orders');
          }}
          onProfile={() => {}} 
          onLogout={logout} 
          showCart={true} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
        <Footer />
      </View>
    );
  }

  if (!menuItem) {
    return (
      <View style={styles.mainContainer}>
        <Header 
          onCart={() => navigation.navigate('Cart')} 
          cartCount={count} 
          notifications={notifications}
          notificationCount={notificationCount}
          onDeleteNotification={(notificationId) => {
            if (clearNotification) {
              clearNotification(notificationId);
            }
          }}
          onNotificationPress={(notif) => {
            // Marquer la notification comme lue
            if (notif.id && markAsRead) {
              markAsRead(notif.id);
            }
            if (notif.orderId) {
              // Naviguer vers la page de commandes avec l'orderId en paramètre
              navigation.navigate('Orders', { orderId: notif.orderId });
            } else {
              navigation.navigate('Orders');
            }
          }}
          onNotifications={() => {
            navigation.navigate('Orders');
          }}
          onProfile={() => {}} 
          onLogout={logout} 
          showCart={true} 
        />
        <View style={styles.loadingContainer}>
          <Text>Plat non trouvé</Text>
        </View>
        <Footer />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <Header
        onCart={() => navigation.navigate('Cart')}
        cartCount={count}
          notifications={notifications}
          notificationCount={notificationCount}
          onDeleteNotification={(notificationId) => {
            if (clearNotification) {
              clearNotification(notificationId);
            }
          }}
          onNotificationPress={(notif) => {
            // Marquer la notification comme lue
            if (notif.id && markAsRead) {
              markAsRead(notif.id);
            }
            if (notif.orderId) {
              // Naviguer vers la page de commandes avec l'orderId en paramètre
              navigation.navigate('Orders', { orderId: notif.orderId });
            } else {
              navigation.navigate('Orders');
            }
          }}
          onNotifications={() => {
            navigation.navigate('Orders');
          }}
        onProfile={() => navigation.navigate('Profile')}
        onLogout={logout}
        showCart={true}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <MenuItemImage images={menuItem.images} />
        
        <MenuItemHeader
          name={menuItem.name}
          price={menuItem.price}
          rating={menuItem.rating}
          ratingCount={menuItem.ratingCount}
        />
        
        <MenuItemDescription
          description={menuItem.description}
          longDescription={menuItem.longDescription}
          isExpanded={expandedSection === 'description'}
          onToggle={() =>
            setExpandedSection(expandedSection === 'description' ? null : 'description')
          }
        />
        
        {/**
         * Filtrer les options pour éviter les doublons avec nos sections
         * "Accompagnements" et "Boisson" (certaines BDD peuvent déjà contenir
         * des groupes d'options portant ces noms).
         */}
        <MenuItemOptions
          options={filteredOptions}
          selectedOptions={selectedOptionsList[currentPortionIndex] || {}}
          onOptionChange={handleOptionChange}
          isExpanded={expandedSection === 'options'}
          onToggle={() =>
            setExpandedSection(expandedSection === 'options' ? null : 'options')
          }
        />
        
        {/* Section Accompagnements (données backend) */}
        {accompOption && accompagnementsChoices.length > 0 && (
          <View style={styles.extraSection}>
            <Text style={styles.extraTitle}>Accompagnements</Text>
            <View style={styles.extraList}>
              {accompagnementsChoices.map((choice, idx) => {
                const optKey = accompOption?.id ?? 'accompagnements';
                const key = getChoiceKey(choice, optKey, idx);
                const value = getChoiceValue(choice);
                const label = getChoiceLabel(choice);
                const choicePrice = getChoicePrice(choice, accompagnementsChoices);
                const currentOpts = selectedOptionsList[currentPortionIndex] || {};
                const selectedArray = currentOpts[optKey] || [];
                const selected = selectedArray.includes(value);
                return (
                  <TouchableOpacity
                    key={`acc-${key}`}
                    style={styles.extraCheckboxRow}
                    onPress={() => toggleAccompagnement(choice)}
                  >
                    <View style={[styles.extraCheckbox, selected && styles.extraCheckboxChecked]}>
                      {selected && <MaterialIcons name="check" size={14} color="#fff" />}
                    </View>
                    <Text style={styles.extraLabel}>
                      {label} 
                      {choicePrice > 0 && <Text style={styles.extraPrice}>+{choicePrice.toFixed(2)} €</Text>}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Section Boissons (backend, afficher toutes les boissons) */}
        {boissonOption && drinksChoices.length > 0 && (
          <View style={styles.extraSection}>
            <Text style={styles.extraTitle}>Boissons</Text>
            <View style={styles.extraList}>
              {drinksChoices.map((choice, idx) => {
                const optKey = boissonOption?.id ?? 'boisson';
                const key = getChoiceKey(choice, optKey, idx);
                const value = getChoiceValue(choice);
                const label = getChoiceLabel(choice);
                const choicePrice = getChoicePrice(choice, drinksChoices);
                const currentOpts = selectedOptionsList[currentPortionIndex] || {};
                const selectedArray = currentOpts[optKey] || [];
                const selected = selectedArray.includes(value);
                return (
                  <TouchableOpacity
                    key={`drink-${key}`}
                    style={styles.extraCheckboxRow}
                    onPress={() => toggleDrink(choice)}
                  >
                    <View style={[styles.extraCheckbox, selected && styles.extraCheckboxChecked]}>
                      {selected && <MaterialIcons name="check" size={14} color="#fff" />}
                    </View>
                    <Text style={styles.extraLabel}>
                      {label} 
                      {choicePrice > 0 && <Text style={styles.extraPrice}>+{choicePrice.toFixed(2)} €</Text>}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Sélecteur de portion à éditer (si quantité > 1) */}
        {quantity > 1 && (
          <View style={styles.extraSection}>
            <Text style={styles.extraTitle}>Portion à éditer</Text>
            <View style={styles.portionChips}>
              {Array.from({ length: quantity }).map((_, i) => (
                <TouchableOpacity
                  key={`portion-${i}`}
                  style={[styles.portionChip, i === currentPortionIndex && styles.portionChipActive]}
                  onPress={() => setCurrentPortionIndex(i)}
                >
                  <Text style={[styles.portionChipText, i === currentPortionIndex && styles.portionChipTextActive]}>{i + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Checklist Menu */}
        <View style={styles.extraSection}>
          <Text style={styles.extraTitle}>Checklist Menu</Text>
          <View style={styles.checklistContainer}>
            {Array.from({ length: Math.max(1, quantity) }).map((_, idx) => {
              const opts = selectedOptionsList[idx] || {};
              const accKey = accompOption?.id ?? 'accompagnements';
              const bKey = boissonOption?.id ?? 'boisson';
              const acc = Array.isArray(opts[accKey]) ? opts[accKey] : [];
              const drinkArr = Array.isArray(opts[bKey]) ? opts[bKey] : [];
              return (
                <View key={`portion-check-${idx}`}>
                  <View style={styles.checklistRow}>
                    <Text style={styles.checklistBullet}>-</Text>
                    <Text style={styles.checklistText}>{menuItem?.name}</Text>
                  </View>
                  {acc.map((label, i) => (
                    <View key={`p${idx}-acc-${i}`} style={styles.checklistRow}>
                      <Text style={styles.checklistBullet}>-</Text>
                      <Text style={styles.checklistText}>{String(label)}</Text>
                    </View>
                  ))}
                  {drinkArr.map((drink, i) => {
                    const drinkLabel = getChoiceLabel(drink);
                    return (
                      <View key={`p${idx}-drink-${i}`} style={styles.checklistRow}>
                        <Text style={styles.checklistBullet}>-</Text>
                        <Text style={styles.checklistText}>{drinkLabel}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Actions: quantité + ajouter au panier */}
        <MenuItemActions
          quantity={quantity}
          onQuantityChange={handleQuantityChange}
          onAddToCart={handleAddToCart}
          loading={adding}
          disabled={adding}
          pricePreview={`${computedTotal.toFixed(2)} €`}
        />

        {/* Action utilitaire: Réinitialiser la sélection */}
        <View style={styles.toolsRow}>
          <TouchableOpacity onPress={clearSelections} style={styles.resetBtn}>
            <Text style={styles.resetText}>Réinitialiser la sélection</Text>
          </TouchableOpacity>
        </View>

        {/* Avis et Questions doivent être après Ajouter au panier */}
        <MenuItemReviews
          reviews={reviews}
          isExpanded={expandedSection === 'reviews'}
          onToggle={() =>
            setExpandedSection(expandedSection === 'reviews' ? null : 'reviews')
          }
        />
        
        <MenuItemQuestions
          questions={questions}
          isExpanded={expandedSection === 'questions'}
          onToggle={() =>
            setExpandedSection(expandedSection === 'questions' ? null : 'questions')
          }
        />

        <View style={styles.contentSpacer} />

        {/* Footer défilant avec la page */}
        <Footer onContact={() => navigation.navigate('Contact')} />
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    flexDirection: 'column',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSpacer: {
    height: 20,
  },
  // Styles compléments additionnels
  extraSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 8,
  },
  extraTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  extraList: {
    marginTop: 4,
  },
  extraCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  extraCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  extraCheckboxChecked: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  extraLabel: {
    fontSize: 14,
    color: '#333',
  },
  extraPrice: {
    color: '#22c55e',
    fontWeight: '600',
  },
  checklistContainer: {
    marginTop: 4,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checklistBullet: {
    width: 14,
    textAlign: 'center',
    color: '#333',
    marginRight: 6,
  },
  checklistText: {
    fontSize: 14,
    color: '#333',
  },
  toolsRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    marginTop: -6,
  },
  resetBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  resetText: {
    color: '#22c55e',
    fontWeight: '600',
  },
  // Portion chips
  portionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  portionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  portionChipActive: {
    backgroundColor: '#ffefe8',
    borderColor: '#22c55e',
  },
  portionChipText: {
    color: '#333',
    fontWeight: '600',
  },
  portionChipTextActive: {
    color: '#22c55e',
  },
});

export default MenuItemDetailScreen;

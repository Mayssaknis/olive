import AsyncStorage from '@react-native-async-storage/async-storage';

export type Locale = 'fr' | 'ar';

export const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: 'fr', label: 'Français', flag: 'FR' },
  { value: 'ar', label: 'العربية', flag: 'AR' },
];

/**
 * Dictionnaire arabe : la clé est le texte français affiché dans l'interface.
 * Le français sert de clé (aucune table fr nécessaire) et de repli si une
 * traduction est manquante.
 */
export const ar: Record<string, string> = {
  // --- Commun ---
  'Enregistrer': 'حفظ',
  'Annuler': 'إلغاء',
  'Valider': 'تأكيد',
  'Supprimer': 'حذف',
  'Modifier': 'تعديل',
  'Ajouter': 'إضافة',
  'Rechercher': 'بحث',
  'Chargement…': 'جارٍ التحميل…',
  'Réessayer': 'أعد المحاولة',
  'Erreur': 'خطأ',
  'Aucun résultat': 'لا توجد نتائج',
  'Actif': 'نشط',
  'Inactif': 'غير نشط',
  'Oui': 'نعم',
  'Non': 'لا',
  'Nom': 'الاسم',
  'Prénom': 'اللقب',
  'Téléphone': 'الهاتف',
  'Adresse': 'العنوان',
  'E-mail': 'البريد الإلكتروني',
  'Statut': 'الحالة',
  'Date': 'التاريخ',
  'Client': 'الحريف',
  'Les clients': 'الحرفاء',
  'Enregistrer les modifications': 'حفظ التعديلات',

  // --- Authentification ---
  "Connexion": 'تسجيل الدخول',
  "Identifiant": 'اسم المستخدم',
  "Mot de passe": 'كلمة المرور',
  "Se connecter": 'دخول',
  "Nom d'utilisateur": "اسم المستخدم",
  "Connectez-vous pour continuer": 'سجّل الدخول للمتابعة',
  "Identifiants incorrects.": 'بيانات الدخول غير صحيحة.',
  "Déconnexion": 'تسجيل الخروج',
  "Se déconnecter": 'تسجيل الخروج',
  "Voulez-vous vous déconnecter ?": 'هل تريد تسجيل الخروج؟',

  // --- Navigation / onglets ---
  "Tableau de bord": 'لوحة القيادة',
  "Clients": 'الحرفاء',
  "Apports": 'الاستلامات',
  "Plus": 'المزيد',
  "Gestion": 'التسيير',
  "Suivi & analyse": 'المتابعة والتحليل',
  "Compte": 'الحساب',
  "Profil": 'الملف الشخصي',
  "Stock": 'المخزون',
  "Livraisons": 'التسليمات',
  "Factures": 'الفواتير',
  "Employés": 'الموظفون',
  "Rapports": 'التقارير',
  "Historique": 'السجل',
  "Notifications": 'الإشعارات',
  "Production": 'الإنتاج',
  "Administrateur": 'مدير',
  'Employé': 'موظف',
  'Utilisateur': 'مستخدم',

  // --- Langue ---
  'Langue': 'اللغة',
  'Français': 'الفرنسية',
  'العربية': 'العربية',
  'Redémarrez l’application pour appliquer le sens de lecture (droite à gauche).': 'أعد تشغيل التطبيق لتطبيق اتجاه القراءة من اليمين إلى اليسار.',

  // --- Changer le mot de passe ---
  'Changer le mot de passe': 'تغيير كلمة المرور',
  'Mot de passe actuel': 'كلمة المرور الحالية',
  'Nouveau mot de passe': 'كلمة المرور الجديدة',
  'Confirmer le nouveau mot de passe': 'تأكيد كلمة المرور الجديدة',
  'Au moins 6 caractères.': 'على الأقل 6 أحرف.',
  'Mot de passe modifié.': 'تم تغيير كلمة المرور.',
  'Les mots de passe ne correspondent pas.': 'كلمتا المرور غير متطابقتين.',
  'Échec du changement de mot de passe.': 'فشل تغيير كلمة المرور.',
  'Charger plus': 'تحميل المزيد',
  'Hors ligne : donnees en cache': 'غير متصل: بيانات محفوظة',

  // --- Tableau de bord ---
  'Apports du jour': 'استلامات اليوم',
  'Poids net du jour': 'الوزن الصافي اليوم',
  'Olives traitées': 'الزيتون المعالج',
  'Huile produite': 'الزيت المنتج',
  'Rendement moyen': 'المردود المتوسط',
  'Opérations en attente': 'عمليات في الانتظار',
  'Stock disponible': 'المخزون المتوفر',
  'Total facturé': 'إجمالي الفواتير',
  'Encaissé': 'المحصّل',
  'Reste à payer': 'المتبقي للدفع',
  'Factures impayées': 'فواتير غير مدفوعة',
  'Apports récents': 'الاستلامات الأخيرة',
  'Reste : {value}': 'الباقي: {value}',
  'Aucune donnée.': 'لا توجد بيانات.',

  // --- Apports ---
  'Nouvel apport': 'استلام جديد',
  'Aucun apport': 'لا يوجد استلام',
  'Enregistrez un apport d’olives.': 'سجّل استلام زيتون.',
  'Rechercher un apport…': 'ابحث عن استلام…',
  'Poids brut': 'الوزن الإجمالي',
  'Tare': 'الفارغ',
  'Poids net': 'الوزن الصافي',
  'Ticket': 'الوصل',
  'N° de ticket': 'رقم الوصل',
  'Réception': 'الاستلام',
  'Observations': 'ملاحظات',
  'Partager le ticket': 'مشاركة الوصل',
  'Télécharger le ticket (PDF)': 'تحميل الوصل (PDF)',
  'Télécharger PDF': 'تحميل PDF',
  'Le rapport affiché peut être téléchargé en PDF.': 'يمكن تحميل التقرير المعروض بصيغة PDF.',
  'Avancement de la production': 'تقدّم الإنتاج',
  'Choisir une nouvelle étape': 'اختر مرحلة جديدة',
  'Signaler anomalie': 'الإبلاغ عن خلل',
  'Enregistrer la production & rendement': 'تسجيل الإنتاج والمردود',
  'Production enregistrée': 'الإنتاج المسجّل',
  'Historique des étapes': 'سجل المراحل',
  'Aucun changement.': 'لا يوجد تغيير.',
  'traitées → {liters} d’huile': 'معالجة ← {liters} زيت',

  // --- Statuts d'apport ---
  'Reçu': 'مستلم',
  'En attente': 'في الانتظار',
  'Tri': 'الفرز',
  'Pressage': 'العصر',
  'Production terminée': 'انتهى الإنتاج',
  'Stockage': 'التخزين',
  'Livraison': 'التسليم',
  'Clôturé': 'مغلق',
  'Anomalie': 'خلل',

  // --- Statuts de facture ---
  'Payée': 'مدفوعة',
  'Partielle': 'جزئية',
  'Impayée': 'غير مدفوعة',

  // --- Factures ---
  'Nouvelle facture': 'فاتورة جديدة',
  'Aucune facture': 'لا توجد فاتورة',
  'Toutes': 'الكل',
  'Impayées': 'غير مدفوعة',
  'Partielles': 'جزئية',
  'Payées': 'مدفوعة',
  'Détail des prestations': 'تفصيل الخدمات',
  'Paiements': 'المدفوعات',
  'Encaisser': 'تحصيل',
  'Aucun paiement enregistré.': 'لا يوجد دفع مسجّل.',
  'Enregistrer un paiement': 'تسجيل دفع',
  'Reste à payer : {value}': 'المتبقي للدفع: {value}',
  'Montant (DT) *': 'المبلغ (د.ت) *',
  'Mode de paiement': 'طريقة الدفع',
  'Référence': 'المرجع',
  'Valider le paiement': 'تأكيد الدفع',
  'Partager la facture': 'مشاركة الفاتورة',
  'Télécharger la facture (PDF)': 'تحميل الفاتورة (PDF)',
  'Émise le {date}': 'صدرت في {date}',
  'échéance {date}': 'الاستحقاق {date}',
  'Espèces': 'نقدا',
  'Virement': 'تحويل',
  'Chèque': 'شيك',
  'Carte': 'بطاقة',
  'Autre': 'أخرى',
  'Total': 'المجموع',
  'Payé': 'المدفوع',
  'Reste': 'الباقي',

  // --- Livraisons ---
  'Nouvelle livraison': 'تسليم جديد',
  'Aucune livraison': 'لا يوجد تسليم',
  'Enregistrez un bon de livraison.': 'سجّل وصل تسليم.',
  'Quantité': 'الكمية',
  'Lot': 'الدفعة',
  'Télécharger le bon de livraison (PDF)': 'تحميل وصل التسليم (PDF)',

  // --- Clients ---
  'Nouveau client': 'حريف جديد',
  'Aucun client': 'لا يوجد حريف',
  'Rechercher un client…': 'ابحث عن حريف…',
  'Fiche client': 'بطاقة الحريف',
  'Apports de ce client': 'استلامات هذا الحريف',
  'Factures de ce client': 'فواتير هذا الحريف',

  // --- Commun (compléments) ---
  'Chargement...': 'جارٍ التحميل...',
  'Oups': 'عذراً',
  'Rechercher...': 'بحث...',
  'Retour': 'رجوع',
  'Accueil': 'الرئيسية',
  'Mon profil': 'ملفي الشخصي',
  'Détail de l’apport': 'تفاصيل الاستلام',
  'Saisie de production': 'إدخال الإنتاج',
  'Stock d’huile': 'مخزون الزيت',
  'Détail de la facture': 'تفاصيل الفاتورة',
  'Modifier l’apport': 'تعديل الاستلام',
  'Modifier l’employé': 'تعديل الموظف',
  'Nouvel employé': 'موظف جديد',
  'Créer la facture': 'إنشاء الفاتورة',
  'Sélectionner un client': 'اختر حريفاً',
  'Sélectionner': 'اختر',

  // --- Apports (compléments) ---
  'Tous': 'الكل',
  'Reçus': 'المستلمة',
  'Terminés': 'المنتهية',
  'Anomalies': 'الخلل',
  'N° apport, client...': 'رقم الاستلام، الحريف...',
  'Enregistrez une réception.': 'سجّل عملية استلام.',
  'Pesée et réception': 'الوزن والاستلام',
  'Nouvel apport d’olives': 'استلام زيتون جديد',
  'Client *': 'الحريف *',
  'Poids brut (kg) *': 'الوزن الإجمالي (كغ) *',
  'Tare (kg)': 'الفارغ (كغ)',
  "Poids de l'emballage, déduit du poids brut.": 'وزن التغليف، يُخصم من الوزن الإجمالي.',
  'Poids net calculé': 'الوزن الصافي المحتسب',
  'N° de ticket (facultatif)': 'رقم الوصل (اختياري)',
  'Laissez vide pour génération automatique.': 'اتركه فارغاً للتوليد التلقائي.',
  'Enregistrer l’apport': 'حفظ الاستلام',
  'Le poids brut doit être supérieur à 0': 'يجب أن يكون الوزن الإجمالي أكبر من 0',
  'La tare ne peut pas être négative': 'لا يمكن أن يكون الفارغ سالباً',
  'La tare doit être inférieure au poids brut': 'يجب أن يكون الفارغ أقل من الوزن الإجمالي',

  // --- Clients (compléments formulaires) ---
  'Rechercher un client...': 'ابحث عن حريف...',
  'Ajoutez votre premier client.': 'أضف حريفك الأول.',
  'Prénom *': 'اللقب *',
  'Nom *': 'الاسم *',
  'Téléphone *': 'الهاتف *',
  'Adresse (facultatif)': 'العنوان (اختياري)',
  'Le prénom est requis': 'اللقب مطلوب',
  'Le nom est requis': 'الاسم مطلوب',
  'Le téléphone est requis': 'الهاتف مطلوب',
  'Numéro de téléphone invalide': 'رقم هاتف غير صالح',
  'Créer le client': 'إنشاء الحريف',

  // --- Livraisons (compléments formulaires) ---
  'Quantité livrée (litres) *': 'الكمية المسلّمة (لتر) *',
  'N° de lot': 'رقم الدفعة',
  'Enregistrer la livraison': 'حفظ التسليم',
  'Quantité invalide': 'كمية غير صالحة',
  'Stock insuffisant ({available} L disponibles)': 'المخزون غير كافٍ ({available} ل متوفرة)',

  // --- Notifications / Historique ---
  'Tout marquer comme lu ({count})': 'تحديد الكل كمقروء ({count})',
  'Aucune notification': 'لا توجد إشعارات',
  'Aucun événement': 'لا توجد أحداث',
  'Système': 'النظام',
  'Création': 'إنشاء',
  'Modification': 'تعديل',
  'Suppression': 'حذف',
  'Changement de statut': 'تغيير الحالة',
  'Paiement': 'دفع',
  'Connexion (historique)': 'دخول',

  // --- Production ---
  'Suivi de production': 'متابعة الإنتاج',
  "Avancement des apports traités à l'huilerie.": 'تقدّم الاستلامات المعالجة في المعصرة.',
  'En cours ({count})': 'قيد التنفيذ ({count})',
  'Aucune opération en cours': 'لا توجد عملية قيد التنفيذ',
  'Terminés / livrés ({count})': 'المنتهية / المسلّمة ({count})',
  'Aucune opération terminée': 'لا توجد عملية منتهية',
  'Consultation seule : votre rôle ne permet pas de modifier la production.': 'عرض فقط: دورك لا يسمح بتعديل الإنتاج.',

  // --- Stock ---
  'Entrée': 'إدخال',
  'Sortie': 'إخراج',
  'Ajustement positif': 'تسوية موجبة',
  'Ajustement négatif': 'تسوية سالبة',
  'Total entrées': 'إجمالي الإدخالات',
  'Total sorties': 'إجمالي الإخراجات',
  'Enregistrer un mouvement': 'تسجيل حركة',
  'Derniers mouvements': 'آخر الحركات',
  'Aucun mouvement': 'لا توجد حركة',
  'Nouveau mouvement de stock': 'حركة مخزون جديدة',
  'Type': 'النوع',
  'Quantité (litres) *': 'الكمية (لتر) *',
  'Client (facultatif)': 'الحريف (اختياري)',
  'Associer à un client': 'ربط بحريف',
  'Motif': 'السبب',
  'Stock disponible actuel : {value}': 'المخزون المتوفر حالياً: {value}',
  'Valider le mouvement': 'تأكيد الحركة',
  'Quantité invalide.': 'كمية غير صالحة.',

  // --- Rendement ---
  'Rendement': 'المردود',
  'Formule : rendement (%) = huile obtenue ÷ olives traitées × 100': 'الصيغة: المردود (٪) = الزيت المتحصل عليه ÷ الزيتون المعالج × 100',
  'Olives traitées (kg) *': 'الزيتون المعالج (كغ) *',
  'Huile obtenue (litres) *': 'الزيت المتحصل عليه (لتر) *',
  'Date de production': 'تاريخ الإنتاج',
  "Poids net de l'apport : {value} kg": 'الوزن الصافي للاستلام: {value} كغ',
  'Notes': 'ملاحظات',
  'Observations...': 'ملاحظات...',
  'Rendement calculé': 'المردود المحتسب',
  'Rendement calculé : {value} %': 'المردود المحتسب: {value} ٪',
  'Enregistrer la production': 'حفظ الإنتاج',
  'Format attendu : AAAA-MM-JJ': 'الصيغة المطلوبة: AAAA-MM-JJ',
  'Quantité d’olives invalide': 'كمية الزيتون غير صالحة',
  'Maximum {value} kg (poids net de l’apport)': 'الحد الأقصى {value} كغ (الوزن الصافي للاستلام)',
  'Quantité d’huile invalide': 'كمية الزيت غير صالحة',

  // --- Rapports ---
  'Global': 'إجمالي',
  'Du': 'من',
  'Au': 'إلى',
  'Facturation': 'الفوترة',
  'Disponible': 'المتوفر',
  'Entrées': 'الإدخالات',
  'Sorties': 'الإخراجات',
  'Aucune donnée': 'لا توجد بيانات',

  // --- Facture (formulaire) ---
  'Date de facture': 'تاريخ الفاتورة',
  'Échéance (facultatif)': 'الاستحقاق (اختياري)',
  'Aucune échéance': 'بدون استحقاق',
  'Prestations & tarifs': 'الخدمات والأسعار',
  'Ligne {n}': 'سطر {n}',
  'Description': 'الوصف',
  'Quantité (L)': 'الكمية (ل)',
  'Prix unitaire': 'سعر الوحدة',
  'Sous-total : {value}': 'المجموع الفرعي: {value}',
  'Ajouter une ligne': 'إضافة سطر',
  'Total facture': 'مجموع الفاتورة',
  'Sélectionnez un client.': 'اختر حريفاً.',
  'Ajoutez au moins une ligne valide (description, quantité, prix).': 'أضف سطراً صالحاً واحداً على الأقل (وصف، كمية، سعر).',

  // --- Divers écrans ---
  'PDF': 'PDF',
  'FACTURE': 'فاتورة',
  "TICKET D'APPORT": 'وصل استلام',
  '{kg} traitées → {liters} d’huile': '{kg} معالجة ← {liters} زيت',
  'Client depuis le {date}': 'حريف منذ {date}',
  'Nouveau': 'جديد',
  'Total : {value}': 'المجموع: {value}',
  'Aucun employé': 'لا يوجد موظف',
  'Montant invalide.': 'مبلغ غير صالح.',

  // --- Tableau de bord (compléments) ---
  'Chargement du tableau de bord...': 'جارٍ تحميل لوحة القيادة...',
  'Bonjour, {value} 👋': 'مرحباً، {value} 👋',
  "Voici l'activité de l'huilerie en temps réel.": 'هذا نشاط المعصرة في الوقت الفعلي.',
  "Apports aujourd'hui": 'استلامات اليوم',
  'Opérations en cours': 'عمليات جارية',
  'Derniers apports': 'آخر الاستلامات',
  'Voir tout': 'عرض الكل',
  'Statistiques calculées en direct depuis la base de données.': 'إحصائيات محتسبة مباشرةً من قاعدة البيانات.',
  "Stock d'huile": 'مخزون الزيت',

  // --- Connexion / démarrage ---
  "Gestion d'huilerie d'huile d'olive": 'تسيير معصرة زيت الزيتون',
  'Accédez à votre espace de travail': 'ادخل إلى مساحة عملك',
  'Identifiant ou e-mail': 'اسم المستخدم أو البريد الإلكتروني',
  'ex : admin': 'مثال: admin',
  'Serveur : {value}': 'الخادم: {value}',
  'Veuillez saisir votre identifiant et votre mot de passe.': 'يرجى إدخال اسم المستخدم وكلمة المرور.',

  // --- Employés (formulaire) ---
  'Le nom complet et l’e-mail sont requis.': 'الاسم الكامل والبريد الإلكتروني مطلوبان.',
  'Identifiant requis et mot de passe de 6 caractères minimum.': 'اسم المستخدم مطلوب وكلمة المرور 6 أحرف على الأقل.',
  'Identifiant *': 'اسم المستخدم *',
  'Nom complet *': 'الاسم الكامل *',
  'E-mail *': 'البريد الإلكتروني *',
  'Nouveau mot de passe (facultatif)': 'كلمة مرور جديدة (اختياري)',
  'Mot de passe *': 'كلمة المرور *',
  '6 caractères minimum. Jamais affiché en clair.': '6 أحرف على الأقل. لا تُعرض أبداً بشكل واضح.',
  'Rôle': 'الدور',
  'Compte actif': 'حساب نشط',
  'Permissions': 'الصلاحيات',
  "L'administrateur dispose de tous les droits automatiquement.": 'المدير يملك جميع الصلاحيات تلقائياً.',
  'Créer l’employé': 'إنشاء الموظف',

  // --- Permissions ---
  'Clients — lecture': 'الحرفاء — قراءة',
  'Clients — création/modification': 'الحرفاء — إنشاء/تعديل',
  'Apports — lecture': 'الاستلامات — قراءة',
  'Apports — saisie': 'الاستلامات — إدخال',
  'Production — lecture': 'الإنتاج — قراءة',
  'Production — saisie/étapes': 'الإنتاج — إدخال/مراحل',
  'Stock — lecture': 'المخزون — قراءة',
  'Stock — mouvements': 'المخزون — حركات',
  'Livraisons — lecture': 'التسليمات — قراءة',
  'Livraisons — saisie': 'التسليمات — إدخال',
  'Factures — lecture': 'الفواتير — قراءة',
  'Factures — création/paiements': 'الفواتير — إنشاء/مدفوعات',
  'Employés — lecture': 'الموظفون — قراءة',
  'Employés — gestion': 'الموظفون — تسيير',

  // --- Sélecteur de date ---
  'Aujourd’hui': 'اليوم',
  'Effacer': 'مسح',
  'Sélectionner une date': 'اختر تاريخاً',
  'Imprimer la fiche': 'طباعة البطاقة',
  'Réglages': 'الإعدادات',
  'Tarif de pressage': 'سعر العصر',
  'Appliqué automatiquement à chaque nouvel apport (prix du kilo net).': 'يطبق تلقائياً على كل وارد جديد (ثمن الكيلو الصافي).',
  'Tarif (DT/kg net)': 'السعر (دينار/كغ صافي)',
  'ex : 0,50': 'مثال : 0,50',
  'Exemple : apport de 500 kg nets → facture auto de 250 DT.': 'مثال : وارد 500 كغ صافي ← فاتورة تلقائية بـ 250 دينار.',
  'Fonctionnement': 'طريقة العمل',
  "Chaque nouvel apport génère automatiquement une facture : poids net × tarif. Une facture déjà générée n'est pas modifiée par un changement de tarif.": 'كل وارد جديد يُنشئ تلقائياً فاتورة: الوزن الصافي × السعر. الفاتورة المُنشأة سابقاً لا تتغير بتغيير السعر.',
  'Dernière modification': 'آخر تعديل',
  'Enregistrer le tarif': 'حفظ السعر',
  'Le tarif doit être supérieur à 0.': 'يجب أن يكون السعر أكبر من 0.',
  'Tarif mis à jour.': 'تم تحديث السعر.',
  'Facture automatique': 'فاتورة تلقائية',
  'Voir la facture': 'عرض الفاتورة',
  'Facture automatique créée pour': 'تم إنشاء فاتورة تلقائية لـ',
};

let cachedLocale: Locale | null = null;

export async function loadStoredLocale(): Promise<Locale | null> {
  if (cachedLocale) return cachedLocale;
  const stored = (await AsyncStorage.getItem('olivepress.locale')) as Locale | null;
  cachedLocale = stored;
  return stored;
}

export async function persistLocale(locale: Locale): Promise<void> {
  cachedLocale = locale;
  await AsyncStorage.setItem('olivepress.locale', locale);
}

export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  let text = locale === 'ar' ? ar[key] ?? key : key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

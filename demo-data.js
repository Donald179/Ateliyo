/* Fictitious data loaded on first use; never contains real customer records. */
window.ATELIYO_DEMO = {
  version: 2,
  settings: {
    shopName: "Atelier Aube",
    email: "demo@ateliyo.test",
    phone: "+226 70 00 00 00",
    currency: "FCFA"
  },
  clients: [
    { id: 1, firstName: "Awa", lastName: "Traoré", phone: "+226 70 11 22 33", email: "awa@example.test", address: "Secteur 5, Bobo-Dioulasso", createdAt: "2026-10-12" },
    { id: 2, firstName: "Moussa", lastName: "Ouédraogo", phone: "+226 70 22 33 44", email: "moussa@example.test", address: "Accart-ville, Bobo-Dioulasso", createdAt: "2026-10-08" },
    { id: 3, firstName: "Fatou", lastName: "Kaboré", phone: "+226 70 33 44 55", email: "fatou@example.test", address: "Secteur 18, Bobo-Dioulasso", createdAt: "2026-09-28" },
    { id: 4, firstName: "Idrissa", lastName: "Sana", phone: "+226 70 44 55 66", email: "", address: "Belleville, Bobo-Dioulasso", createdAt: "2026-09-20" },
    { id: 5, firstName: "Aminata", lastName: "Bazié", phone: "+226 70 55 66 77", email: "aminata@example.test", address: "Centre-ville, Bobo-Dioulasso", createdAt: "2026-09-14" }
  ],
  staff: [
    { id: 1, firstName: "Mariam", lastName: "Diallo", email: "mariam@example.test", phone: "+226 70 12 34 56", role: "Couturière", status: "Actif" },
    { id: 2, firstName: "Ousmane", lastName: "Sawadogo", email: "ousmane@example.test", phone: "+226 70 23 45 67", role: "Coupeur", status: "Actif" },
    { id: 3, firstName: "Salimata", lastName: "Compaoré", email: "salimata@example.test", phone: "+226 70 34 56 78", role: "Couturière", status: "Actif" }
  ],
  measurements: [
    { id: 1, clientId: 1, garment: "Robe", chest: 92, waist: 74, hips: 98, sleeve: 58, shoulders: 39, trouser: "", thigh: "", notes: "Prévoir une aisance confortable.", date: "2026-10-12" },
    { id: 2, clientId: 2, garment: "Chemise", chest: 102, waist: 88, hips: 100, sleeve: 62, shoulders: 46, trouser: "", thigh: "", notes: "", date: "2026-10-09" },
    { id: 3, clientId: 3, garment: "Pantalon", chest: "", waist: 78, hips: 96, sleeve: "", shoulders: "", trouser: 104, thigh: 56, notes: "Coupe droite.", date: "2026-10-02" },
    { id: 4, clientId: 5, garment: "Tenue traditionnelle", chest: 96, waist: 80, hips: 102, sleeve: 60, shoulders: 41, trouser: "", thigh: "", notes: "", date: "2026-09-18" }
  ],
  orders: [
    { id: 1, reference: "CMD-2026-1042", clientId: 1, garment: "Robe", description: "Robe de cérémonie en tissu imprimé", total: 25000, paid: 10000, date: "2026-10-12", dueDate: "2026-11-25", status: "En couture", staffId: 1 },
    { id: 2, reference: "CMD-2026-1038", clientId: 2, garment: "Chemise", description: "Deux chemises en coton", total: 18000, paid: 18000, date: "2026-10-09", dueDate: "2026-11-20", status: "Essayage", staffId: 2 },
    { id: 3, reference: "CMD-2026-1029", clientId: 3, garment: "Pantalon", description: "Pantalon classique, coupe droite", total: 12000, paid: 4000, date: "2026-10-02", dueDate: "2026-11-30", status: "En attente", staffId: 3 },
    { id: 4, reference: "CMD-2026-1015", clientId: 4, garment: "Tenue scolaire", description: "Uniforme scolaire complet", total: 22000, paid: 7000, date: "2026-09-22", dueDate: "2026-10-15", status: "En coupe", staffId: 1 },
    { id: 5, reference: "CMD-2026-1008", clientId: 5, garment: "Tenue traditionnelle", description: "Ensemble traditionnel sur mesure", total: 35000, paid: 15000, date: "2026-09-16", dueDate: "2026-11-28", status: "En attente", staffId: 3 },
    { id: 6, reference: "CMD-2026-0991", clientId: 1, garment: "Jupe", description: "Jupe longue plissée", total: 14000, paid: 14000, date: "2026-09-05", dueDate: "2026-09-25", status: "Livré", staffId: 2 }
  ],
  payments: [
    { id: 1, orderId: 1, amount: 10000, method: "Orange Money", date: "2026-10-12" },
    { id: 2, orderId: 2, amount: 18000, method: "Espèces", date: "2026-10-09" },
    { id: 3, orderId: 3, amount: 4000, method: "Moov Money", date: "2026-10-02" },
    { id: 4, orderId: 4, amount: 7000, method: "Espèces", date: "2026-09-22" },
    { id: 5, orderId: 5, amount: 15000, method: "Wave", date: "2026-09-16" },
    { id: 6, orderId: 6, amount: 14000, method: "Orange Money", date: "2026-09-05" }
  ]
};

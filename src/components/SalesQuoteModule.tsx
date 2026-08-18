/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Client, Equipment, InventoryItem, Quote, QuoteItem, Staff } from '../types';
import { INITIAL_QUOTES, loadFromStorage, saveToStorage } from '../mockData';
import { 
  FileText, Plus, UserPlus, Send, CheckCircle2, Clock, XCircle, 
  AlertTriangle, Phone, Mail, MessageSquare, Building2, Upload, 
  FileCheck, Shield, DollarSign, Wrench, ChevronRight, Eye, Printer, X, Sparkles,
  Copy, Search, Filter, ArrowUpRight, Check, RefreshCw, Cpu, Zap, ShoppingCart
} from 'lucide-react';

interface SalesQuoteModuleProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  equipment: Equipment[];
  inventory: InventoryItem[];
  staff: Staff[];
}

export default function SalesQuoteModule({
  clients,
  setClients,
  equipment,
  inventory,
  staff
}: SalesQuoteModuleProps) {
  const [quotes, setQuotes] = useState<Quote[]>(() =>
    loadFromStorage<Quote[]>('mvl_quotes', INITIAL_QUOTES)
  );

  const [activeView, setActiveView] = useState<'list' | 'new_quote' | 'new_client'>('list');
  const [selectedQuoteForPreview, setSelectedQuoteForPreview] = useState<Quote | null>(null);

  // Quote Category: standard | poliza | suministro_instalacion
  const [quoteCategory, setQuoteCategory] = useState<'standard' | 'poliza' | 'suministro_instalacion'>('standard');

  // Filter & Search states for Quotes List
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'approved' | 'discount_requested' | 'rejected'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  // Origin & Client Selection State
  const [quoteOrigin, setQuoteOrigin] = useState<'registrado' | 'nuevo' | 'publico_general'>('registrado');
  const [quoteType, setQuoteType] = useState<'vendedor' | 'cliente' | 'publico'>('vendedor');
  const [publicClientName, setPublicClientName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [selectedPlantName, setSelectedPlantName] = useState('Planta Principal');
  const [crmGiro, setCrmGiro] = useState('Inyección de Plástico / Manufactura');
  const [clientEmail, setClientEmail] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [concept, setConcept] = useState('');
  const [agentName, setAgentName] = useState('Ing. Leonardo Daniel Torres');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Service Type Definition
  const [serviceTypeCategory, setServiceTypeCategory] = useState<'preventivo' | 'correctivo' | 'predictivo' | 'suministro_refacciones' | 'personalizado'>('preventivo');
  const [customServicePriceRequested, setCustomServicePriceRequested] = useState(false);
  const [customServiceNotes, setCustomServiceNotes] = useState('');

  // Equipment Technical Data
  const [eqType, setEqType] = useState<'Compresor' | 'Secador' | 'Aire Acondicionado' | 'Otros'>('Compresor');
  const [eqBrand, setEqBrand] = useState('Kaeser');
  const [eqModel, setEqModel] = useState('BSD 50');
  const [eqSerial, setEqSerial] = useState('');
  const [eqCapacity, setEqCapacity] = useState('50 HP');
  const [eqVoltage, setEqVoltage] = useState('220V 3F');
  const [eqMode, setEqMode] = useState<'venta' | 'renta' | 'servicio'>('servicio');
  const [isNewEquipmentOnTheFly, setIsNewEquipmentOnTheFly] = useState(false);

  // Policy Form State
  const [policyType, setPolicyType] = useState<'poliza_a' | 'poliza_b'>('poliza_a');
  const [policyVisitsPerYear, setPolicyVisitsPerYear] = useState<number>(3);
  const [policyItems, setPolicyItems] = useState<QuoteItem[]>([
    { partida: 1, description: 'Mantenimiento preventivo Minisplit 1 a 1.5 TR Alta prioridad', brand: 'Kaeser / Clima', quantity: 3, unit: 'servicio', partNumber: 'POL-01', catalogPrice: 1550, total: 13950, deliveryTime: 'A programar', inStock: true },
    { partida: 2, description: 'Mantenimiento preventivo Minisplit 2 a 3 TR Alta prioridad', brand: 'Kaeser / Clima', quantity: 1, unit: 'servicio', partNumber: 'POL-02', catalogPrice: 1900, total: 5700, deliveryTime: 'A programar', inStock: true },
    { partida: 3, description: 'Mantenimiento preventivo UPA de 4 a 10 TR Alta prioridad', brand: 'Clima Ind', quantity: 2, unit: 'servicio', partNumber: 'POL-03', catalogPrice: 3262, total: 19572, deliveryTime: 'A programar', inStock: true },
    { partida: 4, description: 'Mantenimiento preventivo Minisplit 1 a 1.5 TR Baja prioridad', brand: 'Kaeser / Clima', quantity: 14, unit: 'servicio', partNumber: 'POL-04', catalogPrice: 1200, total: 33600, deliveryTime: 'A programar', inStock: true },
    { partida: 5, description: 'Mantenimiento preventivo Minisplit 2 a 3 TR Baja prioridad', brand: 'Kaeser / Clima', quantity: 5, unit: 'servicio', partNumber: 'POL-05', catalogPrice: 1680, total: 16800, deliveryTime: 'A programar', inStock: true },
    { partida: 6, description: 'Mantenimiento preventivo UPA de 4 a 10 TR Baja prioridad', brand: 'Clima Ind', quantity: 5, unit: 'servicio', partNumber: 'POL-06', catalogPrice: 2250, total: 22500, deliveryTime: 'A programar', inStock: true }
  ]);

  // Supply & Installation State (2 tables)
  const [supplyEquipmentItems, setSupplyEquipmentItems] = useState<QuoteItem[]>([
    { partida: 1, description: 'Suministro minisplit 1 TR frío 220vac', brand: 'YORK', quantity: 1, unit: 'pza', partNumber: 'SOLO FRIO', catalogPrice: 17409.28, total: 17409.28, deliveryTime: '1 a 4 semanas', inStock: false },
    { partida: 2, description: 'Suministro de bomba de dren de condensados', brand: 'COLDTEK', quantity: 1, unit: 'pza', partNumber: 'N/A', catalogPrice: 2500, total: 2500, deliveryTime: '1 a 4 semanas', inStock: false },
    { partida: 3, description: 'Instalación y preparación para bomba de dren', brand: 'MVL', quantity: 1, unit: 'servicio', partNumber: 'N/A', catalogPrice: 1600, total: 1600, deliveryTime: 'INMEDIATO', inStock: true },
    { partida: 4, description: 'Instalación de unidad evaporadora y condensadora', brand: 'MVL', quantity: 1, unit: 'servicio', partNumber: 'N/A', catalogPrice: 5000, total: 5000, deliveryTime: 'INMEDIATO', inStock: true },
    { partida: 5, description: 'Servicio de presurización con nitrógeno', brand: 'MVL', quantity: 1, unit: 'servicio', partNumber: 'N/A', catalogPrice: 1200, total: 1200, deliveryTime: 'INMEDIATO', inStock: true },
    { partida: 6, description: 'Revisión de estanquedad', brand: 'MVL', quantity: 1, unit: 'servicio', partNumber: 'N/A', catalogPrice: 500, total: 500, deliveryTime: 'INMEDIATO', inStock: true },
    { partida: 7, description: 'Compensación de gas refrigerante R-32', brand: 'MVL', quantity: 2, unit: 'kg', partNumber: 'N/A', catalogPrice: 1500, total: 3000, deliveryTime: 'INMEDIATO', inStock: true },
    { partida: 8, description: 'Ajuste de cálculo sobrecalentamiento y subenfriamiento', brand: 'MVL', quantity: 1, unit: 'servicio', partNumber: 'N/A', catalogPrice: 850, total: 850, deliveryTime: 'INMEDIATO', inStock: true },
    { partida: 9, description: 'Servicio de tubería de cobre y canalización', brand: 'MIRAGE', quantity: 2, unit: 'tramo', partNumber: 'N/A', catalogPrice: 1500, total: 3000, deliveryTime: 'INMEDIATO', inStock: true },
    { partida: 10, description: 'Ménsula pared para condensador e instalación', brand: 'MVL', quantity: 1, unit: 'juego', partNumber: 'N/A', catalogPrice: 3350, total: 3350, deliveryTime: 'INMEDIATO', inStock: true }
  ]);

  const [supplyElectricalItems, setSupplyElectricalItems] = useState<QuoteItem[]>([
    { partida: 1, description: 'Tubería 3/4 pared delgada', brand: 'OMEGA', quantity: 24, unit: 'tramo', partNumber: 'N/A', catalogPrice: 209.04, total: 5016.96, deliveryTime: 'INMEDIATO', inStock: true },
    { partida: 2, description: 'Cable eléctrico 10 AWG 160 mts', brand: 'INDIANA', quantity: 1, unit: 'rollo', partNumber: 'N/A', catalogPrice: 5270, total: 5270, deliveryTime: 'INMEDIATO', inStock: true },
    { partida: 3, description: 'Cable eléctrico 12 AWG 80 mts', brand: 'INDIANA', quantity: 1, unit: 'rollo', partNumber: 'N/A', catalogPrice: 2100, total: 2100, deliveryTime: 'INMEDIATO', inStock: true },
    { partida: 4, description: 'Condulet OLB 13 mm pared delgada', brand: 'OMEGA', quantity: 12, unit: 'pza', partNumber: 'N/A', catalogPrice: 260, total: 3120, deliveryTime: 'INMEDIATO', inStock: true },
    { partida: 5, description: 'Cople y Conector 13 mm pared delgada (24 pzas c/u)', brand: 'OMEGA', quantity: 2, unit: 'paq', partNumber: 'N/A', catalogPrice: 1020, total: 2040, deliveryTime: 'INMEDIATO', inStock: true },
    { partida: 6, description: 'Interruptor 20 amp 2 polos SQD y Condulet C', brand: 'SQD/OMEGA', quantity: 1, unit: 'pza', partNumber: 'N/A', catalogPrice: 2096.56, total: 2096.56, deliveryTime: 'INMEDIATO', inStock: true },
    { partida: 7, description: 'Soportería e insumos', brand: 'N/A', quantity: 1, unit: 'lote', partNumber: 'N/A', catalogPrice: 1500, total: 1500, deliveryTime: '1 a 2 días', inStock: true },
    { partida: 8, description: 'Canalización y mano de obra eléctrica', brand: 'MVL', quantity: 1, unit: 'servicio', partNumber: 'N/A', catalogPrice: 12086.20, total: 12086.20, deliveryTime: '1 semana', inStock: true }
  ]);

  const [supplyScopeList, setSupplyScopeList] = useState<string[]>([
    '1. Suministro de equipo mini-split.',
    '2. Instalación de evaporadora.',
    '3. Instalación de condensadora.',
    '4. Instalación de bomba de condensados.',
    '5. Canalización de servicio de dren de condensados.',
    '6. Canalización de servicio de tubería cobre.',
    '7. Canalización de servicio eléctrico.',
    '8. Pruebas de hermeticidad de tubería con nitrógeno.',
    '9. Procedimiento de alto vacío en tubería para asegurar y alargar la vida útil del equipo hasta 250 Micrones.',
    '10. Compensación de gas refrigerante con cálculos de sobre calentamiento y sub enfriamiento.',
    '11. Pruebas de flujo de aire con anemómetro y termómetro.',
    '12. Recomendaciones de servicios preventivos posteriores.',
    '13. Canalización e instalación de tubería eléctrica pared delgada.',
    '14. Suministro e instalación de termomagnético 20 * 2 SQUARED.',
    '15. Canalización de cable eléctrico 10 AWG en tubería con tierra física 3 hilos.',
    '16. Conexión de uso rudo a mini Split. Condulet LB'
  ]);

  // Standard Quote Items Linked to Inventory
  const [standardItems, setStandardItems] = useState<QuoteItem[]>([
    { partida: 1, description: 'Filtro de Aire Kaeser 6.2012.0', brand: 'Kaeser', quantity: 1, unit: 'pza', partNumber: '6.2012.0', catalogPrice: 1250, total: 1250, deliveryTime: 'Inmediata', inStock: true, stockQty: 8 },
    { partida: 2, description: 'Aceite Sigma Fluid S-460 (19L)', brand: 'Kaeser', quantity: 1, unit: 'cubeta', partNumber: 'S-460', catalogPrice: 5400, total: 5400, deliveryTime: 'Inmediata', inStock: true, stockQty: 12 }
  ]);

  // Dynamic Add Item to Standard Quote
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [customItemDesc, setCustomItemDesc] = useState('');
  const [customItemBrand, setCustomItemBrand] = useState('Kaeser');
  const [customItemPartNo, setCustomItemPartNo] = useState('');
  const [customItemQty, setCustomItemQty] = useState(1);
  const [customItemUnit, setCustomItemUnit] = useState('pza');
  const [customItemPrice, setCustomItemPrice] = useState(0);

  // Commercial Conditions & Delivery Times
  const [commercialConditions, setCommercialConditions] = useState<string>(
    '1. Precios en Moneda Nacional (MXN) más 16% de IVA.\n2. Tiempo de entrega: DDP en planta cliente (según disponibilidad de inventario).\n3. Condiciones de pago: Crédito 30 días con Orden de Compra autorizada.\n4. Vigencia de la cotización: 30 días naturales a partir de su emisión.\n5. Garantía: 12 meses en refacciones originales instaladas por MVL y 90 días en mano de obra.'
  );
  const [deliveryLeadTimeOption, setDeliveryLeadTimeOption] = useState<'auto' | 'inmediato' | 'sobre_pedido' | 'programar'>('auto');
  const [manualDeliveryTime, setManualDeliveryTime] = useState('Inmediata (En Almacén)');

  // Missing prices list & triggers
  const [missingPrices, setMissingPrices] = useState<{ description: string; partNumber: string; requestedPrice: number }[]>([]);
  const [newMissingDesc, setNewMissingDesc] = useState('');
  const [newMissingPartNum, setNewMissingPartNum] = useState('');

  // Plant Access Reqs
  const [imssPayment, setImssPayment] = useState(true);
  const [imssValidity, setImssValidity] = useState(true);
  const [medicalCerts, setMedicalCerts] = useState(true);
  const [riskAssessment, setRiskAssessment] = useState(true);
  const [otherAccessReqs, setOtherAccessReqs] = useState('');

  // New Client Modal Form
  const [newClientName, setNewClientName] = useState('');
  const [newClientRfc, setNewClientRfc] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [isParticular, setIsParticular] = useState(false);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Auto-calculated Delivery Time based on item stock status
  const calculatedDeliveryTime = useMemo(() => {
    if (deliveryLeadTimeOption !== 'auto') {
      if (deliveryLeadTimeOption === 'inmediato') return 'Inmediata (En Stock)';
      if (deliveryLeadTimeOption === 'sobre_pedido') return '3 a 5 días hábiles (Sobre Pedido)';
      return manualDeliveryTime;
    }
    const currentItems = quoteCategory === 'standard' ? standardItems :
                         quoteCategory === 'poliza' ? policyItems :
                         [...supplyEquipmentItems, ...supplyElectricalItems];
    
    const hasOutOfStock = currentItems.some(i => i.inStock === false);
    return hasOutOfStock ? '3 a 5 días hábiles (Piezas sobre pedido)' : 'Inmediata (Existencia en almacén)';
  }, [deliveryLeadTimeOption, manualDeliveryTime, quoteCategory, standardItems, policyItems, supplyEquipmentItems, supplyElectricalItems]);

  // Handle Add Item from Catalog/Inventory
  const handleAddPartFromInventory = () => {
    if (selectedInventoryId) {
      const invItem = inventory.find(i => i.id === selectedInventoryId);
      if (!invItem) return;
      const newItem: QuoteItem = {
        partida: standardItems.length + 1,
        description: invItem.name,
        brand: invItem.code.includes('K') ? 'Kaeser' : 'MVL',
        quantity: customItemQty || 1,
        unit: customItemUnit || 'pza',
        partNumber: invItem.code,
        catalogPrice: invItem.price || 0, // standard catalog price
        total: (invItem.price || 0) * (customItemQty || 1),
        deliveryTime: invItem.stock > 0 ? 'Inmediata' : '3 a 5 días',
        inStock: invItem.stock > 0,
        stockQty: invItem.stock
      };
      setStandardItems([...standardItems, newItem]);
      setSelectedInventoryId('');
      setCustomItemQty(1);
    } else if (customItemDesc) {
      const newItem: QuoteItem = {
        partida: standardItems.length + 1,
        description: customItemDesc,
        brand: customItemBrand,
        quantity: customItemQty || 1,
        unit: customItemUnit || 'pza',
        partNumber: customItemPartNo || 'S/N',
        catalogPrice: Number(customItemPrice) || 0,
        total: (Number(customItemPrice) || 0) * (customItemQty || 1),
        deliveryTime: 'A cotizar / Sobre pedido',
        inStock: false,
        isCustomPriceRequest: Number(customItemPrice) === 0
      };
      setStandardItems([...standardItems, newItem]);
      if (Number(customItemPrice) === 0) {
        setMissingPrices([...missingPrices, { description: customItemDesc, partNumber: customItemPartNo, requestedPrice: 0 }]);
      }
      setCustomItemDesc('');
      setCustomItemPartNo('');
      setCustomItemPrice(0);
      setCustomItemQty(1);
    }
  };

  const handleRemoveStandardItem = (idx: number) => {
    const updated = standardItems.filter((_, i) => i !== idx).map((item, i) => ({ ...item, partida: i + 1 }));
    setStandardItems(updated);
  };

  const handleAddMissingPrice = () => {
    if (!newMissingDesc) return;
    setMissingPrices([...missingPrices, { description: newMissingDesc, partNumber: newMissingPartNum, requestedPrice: 0 }]);
    setNewMissingDesc('');
    setNewMissingPartNum('');
  };

  const handleLoadAndreaExcelParts = () => {
    const andreaItems: QuoteItem[] = [
      { partida: 1, description: 'F.AIRE (Filtro de aire)', brand: 'KC160-017 (OEM KAISER)', quantity: 1, unit: 'pza', partNumber: '6.2000.0', catalogPrice: 1645.00, total: 1645.00, deliveryTime: 'Inmediata', inStock: true, stockQty: 5 },
      { partida: 2, description: 'F ACEITE (Filtro de aceite)', brand: 'KL320-014 (OEM KAISER)', quantity: 1, unit: 'pza', partNumber: '6.1985.0', catalogPrice: 395.00, total: 395.00, deliveryTime: 'Inmediata', inStock: true, stockQty: 10 },
      { partida: 3, description: 'F. SEPARADOR (Filtro separador)', brand: 'MV110-003 (OEM KAISER)', quantity: 1, unit: 'pza', partNumber: '6.1963.0', catalogPrice: 2668.00, total: 2668.00, deliveryTime: 'Inmediata', inStock: true, stockQty: 4 },
      { partida: 4, description: 'V. PRES MIN (Válvula de presión mínima)', brand: 'KAISER / KAESER', quantity: 1, unit: 'pza', partNumber: '4.7333.0', catalogPrice: 1850.00, total: 1850.00, deliveryTime: 'Inmediata', inStock: true, stockQty: 3 },
      { partida: 5, description: 'V. ANTI RETORNO (Válvula anti retorno)', brand: 'KAISER / KAESER', quantity: 1, unit: 'pza', partNumber: '2.0701.0', catalogPrice: 1250.00, total: 1250.00, deliveryTime: 'Inmediata', inStock: true, stockQty: 2 },
      { partida: 6, description: 'V. TERMOSTATICA (Válvula termostática)', brand: 'KAISER / KAESER', quantity: 1, unit: 'pza', partNumber: '7.0399.0', catalogPrice: 2100.00, total: 2100.00, deliveryTime: 'Inmediata', inStock: true, stockQty: 2 },
      { partida: 7, description: 'V. LINEA BARRIDO', brand: 'KAISER / KAESER', quantity: 1, unit: 'pza', partNumber: 'S/N', catalogPrice: 650.00, total: 650.00, deliveryTime: 'Inmediata', inStock: true, stockQty: 6 },
      { partida: 8, description: 'V. ADMISION', brand: 'KAISER / KAESER', quantity: 1, unit: 'pza', partNumber: 'S/N', catalogPrice: 3200.00, total: 3200.00, deliveryTime: 'Inmediata', inStock: true, stockQty: 2 },
      { partida: 9, description: 'LUBRICANTE SINTÉTICO (40 Litros)', brand: 'KAOA467C-05 (OEM KAISER)', quantity: 1, unit: 'cubeta 40L', partNumber: 'KAOA467C-05', catalogPrice: 10353.50, total: 10353.50, deliveryTime: 'Inmediata', inStock: true, stockQty: 15 }
    ];
    setStandardItems(andreaItems);
    setConcept('Cotización de Refacciones y Consumibles para Compresor KAISER AS 30 T (Serie 1030) - Cliente ANDREA');
    setEqBrand('Kaeser');
    setEqModel('AS 30 T');
    setEqCapacity('30 HP');
    setEqVoltage('220V 3F');
  };

  const handleDuplicateQuote = (q: Quote) => {
    // Fill all form states from target quote
    setQuoteCategory(q.quoteCategory || 'standard');
    setQuoteOrigin(q.quoteOrigin || 'registrado');
    setQuoteType(q.quoteType || 'vendedor');
    setSelectedClientId(q.clientId || clients[0]?.id || '');
    setPublicClientName(q.publicClientName || '');
    setConcept(`${q.concept} (Copia / Renovación)`);
    setAgentName(q.agentName || 'Ing. Leonardo Daniel Torres');
    setSelectedPlantName(q.plantName || 'Planta Principal');
    setCrmGiro(q.crmGiro || 'Manufactura');
    setCommercialConditions(q.commercialConditions || commercialConditions);
    
    if (q.equipmentDetails) {
      setEqBrand(q.equipmentDetails.brand || 'Kaeser');
      setEqModel(q.equipmentDetails.model || 'BSD 50');
      setEqSerial(q.equipmentDetails.serialNumber || '');
      setEqCapacity(q.equipmentDetails.capacity || '50 HP');
      setEqVoltage(q.equipmentDetails.voltage || '220V 3F');
    }

    if (q.itemsTable && q.itemsTable.length > 0) {
      setStandardItems(q.itemsTable);
    }
    if (q.supplyInstallationDetails) {
      setSupplyEquipmentItems(q.supplyInstallationDetails.equipmentItems || []);
      setSupplyElectricalItems(q.supplyInstallationDetails.electricalItems || []);
    }
    if (q.policyDetails) {
      setPolicyType(q.policyDetails.policyType || 'poliza_a');
      setPolicyVisitsPerYear(q.policyDetails.visitsPerYear || 3);
    }

    setActiveView('new_quote');
  };

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();

    let subtotal = 0;
    let itemsToSave: QuoteItem[] = [];

    if (quoteCategory === 'standard') {
      itemsToSave = standardItems;
      subtotal = standardItems.reduce((sum, item) => sum + item.total, 0);
    } else if (quoteCategory === 'poliza') {
      itemsToSave = policyItems;
      subtotal = policyItems.reduce((sum, item) => sum + item.total, 0);
    } else if (quoteCategory === 'suministro_instalacion') {
      itemsToSave = [...supplyEquipmentItems, ...supplyElectricalItems];
      subtotal = itemsToSave.reduce((sum, item) => sum + item.total, 0);
    }

    const subtotalWithDiscount = subtotal * (1 - discountPercent / 100);
    const tax = subtotalWithDiscount * 0.16;
    const total = subtotalWithDiscount + tax;

    const folNum = quoteCategory === 'poliza' ? `${Date.now().toString().slice(-6)}GNG` :
                   quoteCategory === 'suministro_instalacion' ? `M2-${quotes.length + 1000}-GNG` :
                   `COT-2026-0${quotes.length + 1}`;

    const defaultConcept = quoteCategory === 'poliza'
      ? `Cotización de Póliza de Mantenimiento Anual Equipos de Climatización (${policyType === 'poliza_a' ? 'Póliza Tipo A - Reparaciones no incluidas' : 'Póliza Tipo B - Reparaciones incluidas'})`
      : quoteCategory === 'suministro_instalacion'
      ? `Cotización de Suministro e Instalación de Mini Split YORK y Canalización Eléctrica`
      : `Servicio ${serviceTypeCategory.toUpperCase()} - ${eqType} ${eqBrand} ${eqModel}`;

    const newQ: Quote = {
      id: 'q_' + Date.now(),
      folNum,
      clientId: quoteOrigin === 'publico_general' ? 'publico' : selectedClientId,
      clientName: quoteOrigin === 'publico_general' ? publicClientName : (selectedClient?.name || 'Cliente'),
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      concept: concept || defaultConcept,
      subtotal: subtotalWithDiscount,
      tax,
      total,
      status: discountPercent > 5 ? 'discount_requested' : 'sent',
      quoteType,
      quoteOrigin,
      quoteCategory,
      policyType,
      serviceTypeCategory,
      customServicePriceRequested,
      publicClientName,
      discountRequested: discountPercent > 0 ? discountPercent : undefined,
      commercialConditions,
      deliveryLeadTime: calculatedDeliveryTime,
      agentName,
      plantName: selectedPlantName,
      crmGiro,
      whatsapp: clientWhatsapp,
      clientEmail,
      itemsTable: itemsToSave,
      policyDetails: quoteCategory === 'poliza' ? {
        policyType,
        visitsPerYear: policyVisitsPerYear,
        priorityHighHours: 12,
        priorityMidHours: 72,
        priorityLowDays: 20
      } : undefined,
      supplyInstallationDetails: quoteCategory === 'suministro_instalacion' ? {
        equipmentItems: supplyEquipmentItems,
        electricalItems: supplyElectricalItems,
        scopeList: supplyScopeList
      } : undefined,
      plantAccessReqs: {
        imssPayment,
        imssRightsValidity: imssValidity,
        medicalCertificates: medicalCerts,
        riskAssessmentForm: riskAssessment,
        others: otherAccessReqs
      },
      equipmentDetails: {
        equipmentType: eqType,
        brand: eqBrand,
        model: eqModel,
        serialNumber: eqSerial,
        capacity: eqCapacity,
        voltage: eqVoltage,
        serviceType: serviceTypeCategory,
        mode: eqMode
      },
      missingPricesList: missingPrices.length > 0 ? missingPrices : undefined
    };

    const updated = [newQ, ...quotes];
    setQuotes(updated);
    saveToStorage('mvl_quotes', updated);
    setActiveView('list');
    setSelectedQuoteForPreview(newQ);
  };

  // Change quote status & trigger pre-billing request if approved
  const handleUpdateQuoteStatus = (quoteId: string, newStatus: Quote['status']) => {
    const updated = quotes.map(q => {
      if (q.id === quoteId) {
        const isApproved = newStatus === 'approved';
        return {
          ...q,
          status: newStatus,
          preBillingRequest: isApproved ? {
            requestedAt: new Date().toISOString().split('T')[0],
            status: 'pending' as const,
            creditDays: 30
          } : q.preBillingRequest
        };
      }
      return q;
    });
    setQuotes(updated);
    saveToStorage('mvl_quotes', updated);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;
    const newC: Client = {
      id: 'c_' + Date.now(),
      name: newClientName,
      companyName: newClientName + (isParticular ? '' : ' S.A. de C.V.'),
      rfc: newClientRfc || 'XAXX010101000',
      email: newClientEmail,
      phone: newClientPhone,
      isIndependent: isParticular,
      plants: [{ id: 'p_1', name: 'Planta Principal', address: 'Dirección Registrada', city: 'Monterrey, NL' }],
      contacts: [{ name: newClientName, role: isParticular ? 'Cliente Particular' : 'Contacto Comercial', phone: newClientPhone, email: newClientEmail }]
    };
    const updated = [newC, ...clients];
    setClients(updated);
    saveToStorage('mvl_clients', updated);
    setSelectedClientId(newC.id);
    setQuoteOrigin('registrado');
    setActiveView('new_quote');
    setNewClientName('');
  };

  // Filtered quotes list
  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const matchSearch = q.folNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.concept.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (q.agentName && q.agentName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'all' || q.status === statusFilter;
      const matchClient = clientFilter === 'all' || q.clientId === clientFilter;
      return matchSearch && matchStatus && matchClient;
    });
  }, [quotes, searchQuery, statusFilter, clientFilter]);

  return (
    <div className="space-y-6 text-left">
      {/* Top Action Header Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-[10px] font-black text-[#0196C1] uppercase tracking-wider bg-sky-50 px-2.5 py-1 rounded mb-1 inline-block">
            Módulo Oficial de Ventas, Cotizaciones Dinámicas & Enlace a Inventario
          </span>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0196C1]" />
            Generador Comercial & Expediente de Cotizaciones MVL
          </h2>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button
            onClick={() => {
              setQuoteCategory('standard');
              setActiveView('new_quote');
            }}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> [+ Cotización Estándar]
          </button>
          <button
            onClick={() => {
              setQuoteCategory('poliza');
              setActiveView('new_quote');
            }}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
          >
            <Sparkles className="w-4 h-4" /> [+ Cotización Póliza Anual]
          </button>
          <button
            onClick={() => {
              setQuoteCategory('suministro_instalacion');
              setActiveView('new_quote');
            }}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
          >
            <Wrench className="w-4 h-4" /> [+ Suministro e Instalación]
          </button>
          <button
            onClick={() => setActiveView('new_client')}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4" /> [+ Nuevo Cliente]
          </button>
        </div>
      </div>

      {/* VIEW: New Client Quick Form */}
      {activeView === 'new_client' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 max-w-xl mx-auto">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#0196C1]" />
              Alta Rápida de Cliente Comercial / Industrial
            </h3>
            <button
              onClick={() => setActiveView('list')}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateClient} className="space-y-3">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Razón Social / Nombre Comercial</label>
              <input
                type="text"
                required
                placeholder="Ej. GUALA DISPENSING MEXICO SA DE CV"
                value={newClientName}
                onChange={e => setNewClientName(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#0196C1] outline-none font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">RFC</label>
                <input
                  type="text"
                  placeholder="GDM980101XXX"
                  value={newClientRfc}
                  onChange={e => setNewClientRfc(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#0196C1] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  placeholder="81-8123-4567"
                  value={newClientPhone}
                  onChange={e => setNewClientPhone(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#0196C1] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Correo Electrónico para Envío</label>
              <input
                type="email"
                placeholder="compras@cliente.com"
                value={newClientEmail}
                onChange={e => setNewClientEmail(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#0196C1] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="particular_check"
                checked={isParticular}
                onChange={e => setIsParticular(e.target.checked)}
                className="rounded text-[#0196C1] focus:ring-[#0196C1]"
              />
              <label htmlFor="particular_check" className="text-xs font-bold text-slate-700 cursor-pointer">
                Marcar como "Particular Independiente / Venta Mostrador" (Sin RFC fiscal requerido)
              </label>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Guardar Cliente e Iniciar Cotización
              </button>
              <button
                type="button"
                onClick={() => setActiveView('list')}
                className="py-2.5 px-4 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: New / Edit Quote Form */}
      {activeView === 'new_quote' && (
        <form onSubmit={handleSaveQuote} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase text-[#0196C1] bg-sky-50 px-2 py-0.5 rounded">
                Plantilla Activa: {quoteCategory === 'poliza' ? 'Póliza Anual de Climatización' : quoteCategory === 'suministro_instalacion' ? 'Suministro e Instalación HVAC' : 'Cotización Estándar de Refacciones'}
              </span>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2 mt-1">
                <FileText className="w-5 h-5 text-[#0196C1]" /> 
                {quoteCategory === 'poliza' ? 'Cotizador de Póliza Anual de Mantenimiento' :
                 quoteCategory === 'suministro_instalacion' ? 'Cotizador de Suministro e Instalación (Equipos y Canalización)' :
                 'Generador de Cotización Industrial Estándar'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('list')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1"
            >
              ← Volver al Historial
            </button>
          </div>

          {/* 1. SELECCIÓN DE ORIGEN & TIPO DE CLIENTE */}
          <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#0196C1]" /> 1. Selección y Clasificación de Cliente
              </label>
              <button
                type="button"
                onClick={() => setActiveView('new_client')}
                className="text-[10px] font-extrabold text-[#0196C1] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Registrar Nuevo Cliente al Vuelo
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setQuoteOrigin('registrado')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-left ${
                  quoteOrigin === 'registrado' ? 'bg-white border-[#0196C1] text-[#0196C1] ring-1 ring-[#0196C1]' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                <span className="block font-black">Cliente Registrado</span>
                <span className="text-[10px] text-slate-400">Catálogo de empresas con RFC</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuoteOrigin('nuevo');
                  setActiveView('new_client');
                }}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-left ${
                  quoteOrigin === 'nuevo' ? 'bg-white border-[#0196C1] text-[#0196C1] ring-1 ring-[#0196C1]' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                <span className="block font-black">+ Cliente Nuevo</span>
                <span className="text-[10px] text-slate-400">Captura directa de datos</span>
              </button>

              <button
                type="button"
                onClick={() => setQuoteOrigin('publico_general')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-left ${
                  quoteOrigin === 'publico_general' ? 'bg-white border-[#0196C1] text-[#0196C1] ring-1 ring-[#0196C1]' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                <span className="block font-black">Venta Público General</span>
                <span className="text-[10px] text-slate-400">Solo nombre de comprador</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
              {quoteOrigin === 'publico_general' ? (
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Nombre del Comprador</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ing. Sergio Molina"
                    value={publicClientName}
                    onChange={e => setPublicClientName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Seleccionar Cliente</label>
                  <select
                    value={selectedClientId}
                    onChange={e => setSelectedClientId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.isIndependent ? '(Particular)' : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Planta / Sucursal</label>
                <input
                  type="text"
                  value={selectedPlantName}
                  onChange={e => setSelectedPlantName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">WhatsApp / Contacto</label>
                <input
                  type="text"
                  placeholder="477-123-4567"
                  value={clientWhatsapp}
                  onChange={e => setClientWhatsapp(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Asesor / Socio Emisor</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-[#0196C1]"
                />
              </div>
            </div>
          </div>

          {/* 2. DEFINICIÓN DEL SERVICIO Y REQUERIMIENTO */}
          <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-3">
            <label className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#0196C1]" /> 2. Tipo de Servicio & Requerimiento Técnico
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'preventivo', label: 'Preventivo', desc: '2k / 4k / 6k hrs' },
                { id: 'correctivo', label: 'Correctivo', desc: 'Reparación / Falla' },
                { id: 'predictivo', label: 'Predictivo', desc: 'Termografía / Aceite' },
                { id: 'suministro_refacciones', label: 'Suministro', desc: 'Venta de refacciones' },
                { id: 'personalizado', label: 'Personalizado', desc: 'Tarifa especial' }
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setServiceTypeCategory(st.id as any)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    serviceTypeCategory === st.id ? 'bg-[#0196C1] text-white border-[#0196C1] shadow-xs' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="block text-xs font-black">{st.label}</span>
                  <span className={`text-[9px] ${serviceTypeCategory === st.id ? 'text-sky-100' : 'text-slate-400'}`}>{st.desc}</span>
                </button>
              ))}
            </div>

            {serviceTypeCategory === 'personalizado' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Servicio fuera de catálogo / Precio sujeto a cotización interna de Gerencia:</span>
                </div>
                <input
                  type="text"
                  placeholder="Detallar alcance especial (ej. Rebobinado de motor 75HP, maniobras pesadas)..."
                  value={customServiceNotes}
                  onChange={e => setCustomServiceNotes(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-amber-300 rounded-lg outline-none"
                />
              </div>
            )}
          </div>

          {/* 3. ASIGNACIÓN Y DATOS DE EQUIPOS */}
          <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#0196C1]" /> 3. Datos Técnicos del Equipo
              </label>
              <button
                type="button"
                onClick={() => setIsNewEquipmentOnTheFly(!isNewEquipmentOnTheFly)}
                className="text-[10px] font-extrabold text-[#0196C1] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> {isNewEquipmentOnTheFly ? 'Usar equipo base' : 'Dar de alta nuevo equipo al vuelo'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Tipo de Equipo</label>
                <select
                  value={eqType}
                  onChange={e => setEqType(e.target.value as any)}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-800"
                >
                  <option value="Compresor">Compresor de Tornillo</option>
                  <option value="Secador">Secador Refrigerativo</option>
                  <option value="Aire Acondicionado">Aire Acondicionado (HVAC)</option>
                  <option value="Otros">Bomba Vacío / Chiller</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Marca</label>
                <input
                  type="text"
                  value={eqBrand}
                  onChange={e => setEqBrand(e.target.value)}
                  placeholder="Kaeser, York, Carrier..."
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Modelo</label>
                <input
                  type="text"
                  value={eqModel}
                  onChange={e => setEqModel(e.target.value)}
                  placeholder="BSD 50, AS 30 T..."
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Capacidad / Toneladas</label>
                <input
                  type="text"
                  value={eqCapacity}
                  onChange={e => setEqCapacity(e.target.value)}
                  placeholder="50 HP / 1.5 TR..."
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Voltaje / Alimentación</label>
                <input
                  type="text"
                  value={eqVoltage}
                  onChange={e => setEqVoltage(e.target.value)}
                  placeholder="220V 3F, 440V, 110V..."
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick preset for Excel Andrea Kaiser AS 30 T */}
          {quoteCategory === 'standard' && (
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded">
                  Plantilla Rápida Predefinida
                </span>
                <h4 className="text-xs font-black text-slate-900 mt-1">Paquete de 9 Refacciones OEM: Andrea (Kaiser AS 30 T)</h4>
                <p className="text-[10px] text-slate-600">Filtros de Aire/Aceite/Separador, Válvulas y Lubricante Sintético 40L</p>
              </div>
              <button
                type="button"
                onClick={handleLoadAndreaExcelParts}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" /> [ Cargar 9 Refacciones Andrea ]
              </button>
            </div>
          )}

          {/* 4. PARTIDAS DE REFACCIONES & LINKEADO A INVENTARIO */}
          {quoteCategory === 'standard' && (
            <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-[#0196C1]" /> 4. Partidas de Refacciones (Validación en Almacén / Stock)
                </label>
                <span className="text-[10px] font-extrabold text-[#0196C1] bg-sky-50 px-2 py-0.5 rounded">
                  {standardItems.length} Partidas agregadas
                </span>
              </div>

              {/* Selector de Inventario / Captura */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Agregar Ítem desde Almacén o Alta Personalizada:</span>
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                  <div className="sm:col-span-2">
                    <select
                      value={selectedInventoryId}
                      onChange={e => {
                        setSelectedInventoryId(e.target.value);
                        if (e.target.value) {
                          const item = inventory.find(i => i.id === e.target.value);
                          if (item) {
                            setCustomItemDesc(item.name);
                            setCustomItemPartNo(item.code);
                            setCustomItemPrice(item.price || 0);
                          }
                        }
                      }}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium"
                    >
                      <option value="">-- Buscar en Inventario MVL --</option>
                      {inventory.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.code} - {inv.name} (Stock: {inv.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    type="text"
                    placeholder="O descripción manual..."
                    value={customItemDesc}
                    onChange={e => setCustomItemDesc(e.target.value)}
                    className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />

                  <input
                    type="text"
                    placeholder="No. Parte"
                    value={customItemPartNo}
                    onChange={e => setCustomItemPartNo(e.target.value)}
                    className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />

                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="1"
                      placeholder="Cant."
                      value={customItemQty}
                      onChange={e => setCustomItemQty(Number(e.target.value))}
                      className="w-16 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Precio Unit."
                      value={customItemPrice || ''}
                      onChange={e => setCustomItemPrice(Number(e.target.value))}
                      className="w-24 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPartFromInventory}
                    className="py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[9px] border-b border-slate-200">
                      <th className="py-2 px-2.5">#</th>
                      <th className="py-2 px-2.5">Descripción</th>
                      <th className="py-2 px-2.5">No. Parte</th>
                      <th className="py-2 px-2.5">Stock Almacén</th>
                      <th className="py-2 px-2.5">Cant.</th>
                      <th className="py-2 px-2.5 text-right">P. Unitario</th>
                      <th className="py-2 px-2.5 text-right">Total</th>
                      <th className="py-2 px-2.5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {standardItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-2.5 font-bold text-slate-500">{item.partida}</td>
                        <td className="py-2 px-2.5 font-bold text-slate-800">{item.description}</td>
                        <td className="py-2 px-2.5 font-mono text-slate-500">{item.partNumber}</td>
                        <td className="py-2 px-2.5">
                          {item.inStock ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-md flex items-center gap-1 w-fit">
                              <Check className="w-3 h-3" /> En Stock ({item.stockQty || 'Disp'})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black rounded-md flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" /> Sobre Pedido
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 font-bold">{item.quantity} {item.unit || 'pza'}</td>
                        <td className="py-2 px-2.5 text-right font-medium">${item.catalogPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-2.5 text-right font-black text-slate-900">${item.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveStandardItem(idx)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                          >
                            × Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. CONDICIONES COMERCIALES Y TIEMPOS DE ENTREGA */}
          <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-4">
            <label className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#0196C1]" /> 5. Condiciones Comerciales & Tiempo de Entrega Dinámico
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Cálculo de Tiempo de Entrega</label>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryLeadTimeOption('auto')}
                      className={`p-2 rounded-xl border text-xs font-bold cursor-pointer ${
                        deliveryLeadTimeOption === 'auto' ? 'bg-[#0196C1] text-white border-[#0196C1]' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Automático (Stock)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryLeadTimeOption('inmediato')}
                      className={`p-2 rounded-xl border text-xs font-bold cursor-pointer ${
                        deliveryLeadTimeOption === 'inmediato' ? 'bg-[#0196C1] text-white border-[#0196C1]' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Inmediata
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryLeadTimeOption('programar')}
                      className={`p-2 rounded-xl border text-xs font-bold cursor-pointer ${
                        deliveryLeadTimeOption === 'programar' ? 'bg-[#0196C1] text-white border-[#0196C1]' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Manual / Agenda
                    </button>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Resultado para el PDF:</span>
                    <strong className="text-slate-800">{calculatedDeliveryTime}</strong>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Condiciones Generales Editables</label>
                <textarea
                  rows={4}
                  value={commercialConditions}
                  onChange={e => setCommercialConditions(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60">
              <label className="text-xs font-bold text-slate-700">Descuento Solicitado (%):</label>
              <input
                type="number"
                min="0"
                max="30"
                value={discountPercent}
                onChange={e => setDiscountPercent(Number(e.target.value))}
                className="w-20 text-xs p-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
              />
              <span className="text-[10px] text-slate-500">
                {discountPercent > 5 ? '⚠️ Descuentos mayores al 5% generarán una alerta de aprobación a Socios/Dirección.' : 'Aprobación automática de vendedor.'}
              </span>
            </div>
          </div>

          <div className="pt-4 flex gap-3 border-t border-slate-100">
            <button
              type="submit"
              className="flex-1 py-3 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Generar, Firmar y Emitir Cotización Oficial MVL
            </button>
          </div>
        </form>
      )}

      {/* VIEW: List of Quotes with Search & Duplication */}
      {activeView === 'list' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Historial & Expediente de Cotizaciones</h3>
              <p className="text-[11px] text-slate-400">Filtrables por vendedor, estatus y cliente con duplicación en 1 clic</p>
            </div>
            <span className="text-xs font-bold text-[#0196C1] bg-sky-50 px-2.5 py-1 rounded-lg">
              {filteredQuotes.length} de {quotes.length} Cotizaciones
            </span>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por folio, cliente, concepto o vendedor..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-700"
              >
                <option value="all">-- Todos los Estatus --</option>
                <option value="sent">Enviada</option>
                <option value="approved">Aprobada</option>
                <option value="discount_requested">Solicitud de Descuento</option>
                <option value="rejected">Rechazada / Vencida</option>
              </select>
            </div>

            <div>
              <select
                value={clientFilter}
                onChange={e => setClientFilter(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-700"
              >
                <option value="all">-- Todos los Clientes --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quotes Cards List */}
          <div className="space-y-3">
            {filteredQuotes.map(q => (
              <div key={q.id} className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-sky-300 transition-all">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-[#0196C1] uppercase bg-sky-100/80 px-2 py-0.5 rounded">
                      {q.folNum}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{q.clientName}</span>
                    <span className="text-[10px] text-slate-400">({q.date})</span>

                    {q.quoteCategory === 'poliza' && (
                      <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        Póliza Anual
                      </span>
                    )}

                    {q.quoteCategory === 'suministro_instalacion' && (
                      <span className="text-[9px] font-black uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                        Suministro e Instalación
                      </span>
                    )}

                    {q.preBillingRequest && (
                      <span className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-indigo-600" /> Facturación Solicitada
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-700">{q.concept}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span>Vendedor: <strong>{q.agentName || 'Ing. Leonardo Daniel Torres'}</strong></span>
                    <span>•</span>
                    <span>Entrega: <strong>{q.deliveryLeadTime || 'Inmediata'}</strong></span>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-2 w-full md:w-auto shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-sm font-black text-slate-900">${q.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                    <span className="text-[9px] text-slate-400 block">IVA incluido</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Status Dropdown */}
                    <select
                      value={q.status}
                      onChange={e => handleUpdateQuoteStatus(q.id, e.target.value as any)}
                      className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                        q.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        q.status === 'discount_requested' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                        q.status === 'rejected' ? 'bg-red-50 text-red-800 border-red-300' :
                        'bg-sky-50 text-sky-800 border-sky-300'
                      }`}
                    >
                      <option value="sent">Enviada</option>
                      <option value="approved">Aprobada</option>
                      <option value="discount_requested">Sol. Descuento</option>
                      <option value="rejected">Rechazada</option>
                    </select>

                    <button
                      onClick={() => handleDuplicateQuote(q)}
                      title="Duplicar cotización para nuevo folio"
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-600" /> Duplicar
                    </button>

                    <button
                      onClick={() => setSelectedQuoteForPreview(q)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-400" /> Ver PDF
                    </button>

                    <a
                      href={`https://wa.me/?text=Hola,%20adjunto%20la%20cotizaci%C3%B3n%20oficial%20${q.folNum}%20por%20$${q.total.toLocaleString('es-MX')}%20para%20${encodeURIComponent(q.clientName)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" /> WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PDF DOCUMENT PREVIEW MODAL (Official Institutional PDF Layout) */}
      {selectedQuoteForPreview && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header Bar */}
            <div className="sticky top-0 bg-slate-900 text-white p-4 rounded-t-2xl flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0196C1]" />
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  Vista Previa Formato Oficial MVL PDF ({selectedQuoteForPreview.folNum})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
                </button>
                <button
                  onClick={() => setSelectedQuoteForPreview(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content Box */}
            <div className="p-8 space-y-6 text-slate-800 text-xs font-sans">
              {/* PDF HEADER */}
              <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-[#0196C1] rounded-xl flex items-center justify-center text-white font-black text-lg">
                      MVL
                    </div>
                    <div>
                      <h1 className="text-base font-black text-slate-900">MVL Control y Mantenimiento</h1>
                      <p className="text-[10px] text-slate-500 font-bold">Razón social: Víctor Pedro Ramírez Barrios | RFC: RABV891002TF6</p>
                      <p className="text-[10px] text-slate-400">RÉGIMEN FISCAL: 612 Personas Físicas con Actividades Empresariales y Profesionales</p>
                      <p className="text-[10px] text-slate-400">José Pérez Marañón #118 B, San José del Consuelo II, CP 37217, León, Guanajuato</p>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-sky-50 p-3 rounded-xl border border-sky-100 min-w-[200px]">
                  <span className="text-[10px] font-extrabold text-[#0196C1] uppercase block">COTIZACIÓN INSTITUCIONAL</span>
                  <span className="text-sm font-black text-slate-900">{selectedQuoteForPreview.folNum}</span>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">León, Gto. A {selectedQuoteForPreview.date}</p>
                </div>
              </div>

              {/* CLIENT INFO BOX */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Cliente / Razón Social</span>
                  <span className="text-xs font-bold text-slate-800">{selectedQuoteForPreview.clientName}</span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Empresa / Sucursal</span>
                  <span className="text-xs font-bold text-slate-800">{selectedQuoteForPreview.plantName || 'Planta Principal'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Tiempo de Entrega</span>
                  <span className="text-xs font-bold text-emerald-700">{selectedQuoteForPreview.deliveryLeadTime || 'Inmediata'}</span>
                </div>
              </div>

              {/* OFFER TITLE */}
              <div className="bg-[#0196C1]/10 p-4 rounded-xl border border-[#0196C1]/30 text-center space-y-1">
                <p className="text-xs text-slate-700">
                  <strong>MVL Control y Mantenimiento</strong> agradece su preferencia y presenta formalmente la propuesta por:
                </p>
                <h2 className="text-sm font-black text-[#0196C1] uppercase">
                  {selectedQuoteForPreview.concept}
                </h2>
              </div>

              {/* TABLE: Items Table */}
              {selectedQuoteForPreview.itemsTable && selectedQuoteForPreview.itemsTable.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Desglose de Partidas, Refacciones y Servicios
                  </h3>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[9px] border-b border-slate-200">
                          <th className="py-2 px-2.5">Partida</th>
                          <th className="py-2 px-2.5">Descripción</th>
                          <th className="py-2 px-2.5">Marca</th>
                          <th className="py-2 px-2.5">Cantidad</th>
                          <th className="py-2 px-2.5">No. Parte</th>
                          <th className="py-2 px-2.5 text-right">P. Unitario</th>
                          <th className="py-2 px-2.5 text-right">Total MXN</th>
                          <th className="py-2 px-2.5">Disponibilidad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedQuoteForPreview.itemsTable.map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5 font-extrabold text-slate-600">{item.partida || i + 1}</td>
                            <td className="py-2 px-2.5 font-bold text-slate-800">{item.description}</td>
                            <td className="py-2 px-2.5 font-semibold text-[#0196C1]">{item.brand || 'MVL'}</td>
                            <td className="py-2 px-2.5 font-bold">{item.quantity} {item.unit || 'pza'}</td>
                            <td className="py-2 px-2.5 font-mono text-slate-500">{item.partNumber || 'N/A'}</td>
                            <td className="py-2 px-2.5 text-right font-medium">${item.catalogPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2 px-2.5 text-right font-bold text-slate-900">${item.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2 px-2.5 font-bold text-[10px] text-slate-600">{item.deliveryTime || 'Inmediata'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TOTALS SUMMARY BOX */}
              <div className="flex justify-end pt-2">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-full sm:w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold">${selectedQuoteForPreview.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>IVA (16%):</span>
                    <span className="font-bold">${selectedQuoteForPreview.tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-slate-200">
                    <span>TOTAL:</span>
                    <span className="text-[#0196C1]">${selectedQuoteForPreview.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                  </div>
                </div>
              </div>

              {/* COMMERCIAL CONDITIONS */}
              <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-[10px] text-slate-600 leading-relaxed">
                <h4 className="font-black text-slate-800 uppercase border-b border-slate-200 pb-1">Condiciones Comerciales de Venta & Cláusulas</h4>
                <div className="whitespace-pre-line font-medium text-slate-700">
                  {selectedQuoteForPreview.commercialConditions || commercialConditions}
                </div>
              </div>

              {/* SIGNATURE AREA WITH DIGITAL SIGNATURE */}
              <div className="pt-6 border-t border-slate-200 flex flex-col items-center justify-center text-center space-y-1">
                <div className="font-serif italic text-lg text-slate-700 font-bold border-b border-slate-300 pb-1 px-8">
                  {selectedQuoteForPreview.agentName || 'Ing. Leonardo Daniel Torres Ojeda'}
                </div>
                <p className="text-xs font-bold text-slate-800">Firma Digital Válida / Soporte Técnico & Ventas</p>
                <p className="text-[10px] text-slate-500">MVL Control y Mantenimiento | cel. 477 4047421 | ltorres.mvl@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

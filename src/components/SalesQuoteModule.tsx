/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Client, Equipment, InventoryItem, Quote, QuoteItem, Staff, WorkOrder, IssuerPartner } from '../types';
import { INITIAL_QUOTES, INITIAL_ISSUER_PARTNERS, loadFromStorage, saveToStorage } from '../mockData';
import { 
  FileText, Plus, UserPlus, Send, CheckCircle2, Clock, XCircle, 
  AlertTriangle, Phone, Mail, MessageSquare, Building2, Upload, 
  FileCheck, Shield, DollarSign, Wrench, ChevronRight, Eye, Printer, X, Sparkles,
  Copy, Search, Filter, ArrowUpRight, Check, RefreshCw, Cpu, Zap, ShoppingCart,
  Camera, FileDown, Layers, Award, BookmarkPlus, FolderCheck, Hash
} from 'lucide-react';

interface SalesQuoteModuleProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  equipment: Equipment[];
  setEquipment?: React.Dispatch<React.SetStateAction<Equipment[]>>;
  inventory: InventoryItem[];
  staff: Staff[];
  workOrders?: WorkOrder[];
  setWorkOrders?: React.Dispatch<React.SetStateAction<WorkOrder[]>>;
}

interface QuickTemplate {
  id: string;
  name: string;
  category: 'standard' | 'poliza' | 'suministro_instalacion' | 'personalizado';
  concept: string;
  brand?: string;
  model?: string;
  items: QuoteItem[];
}

const DEFAULT_TEMPLATES: QuickTemplate[] = [
  {
    id: 'tmpl_andrea',
    name: 'Andrea - Kaeser AS 30 T (9 Refacciones OEM)',
    category: 'standard',
    concept: 'Cotización de Refacciones y Consumibles para Compresor KAISER AS 30 T (Serie 1030) - Cliente ANDREA',
    brand: 'Kaeser',
    model: 'AS 30 T',
    items: [
      { partida: 1, description: 'F.AIRE (Filtro de aire)', brand: 'KC160-017 (OEM KAISER)', quantity: 1, unit: 'pza', partNumber: '6.2000.0', catalogPrice: 1645.00, total: 1645.00, deliveryTime: 'Inmediata', inStock: true, stockQty: 5 },
      { partida: 2, description: 'F ACEITE (Filtro de aceite)', brand: 'KL320-014 (OEM KAISER)', quantity: 1, unit: 'pza', partNumber: '6.1985.0', catalogPrice: 395.00, total: 395.00, deliveryTime: 'Inmediata', inStock: true, stockQty: 10 },
      { partida: 3, description: 'F. SEPARADOR (Filtro separador)', brand: 'MV110-003 (OEM KAISER)', quantity: 1, unit: 'pza', partNumber: '6.1963.0', catalogPrice: 2668.00, total: 2668.00, deliveryTime: 'Inmediata', inStock: true, stockQty: 4 },
      { partida: 4, description: 'V. PRES MIN (Válvula de presión mínima)', brand: 'KAISER / KAESER', quantity: 1, unit: 'pza', partNumber: '4.7333.0', catalogPrice: 1850.00, total: 1850.00, deliveryTime: 'Inmediata', inStock: true, stockQty: 3 },
      { partida: 5, description: 'V. ANTI RETORNO (Válvula anti retorno)', brand: 'KAISER / KAESER', quantity: 1, unit: 'pza', partNumber: '2.0701.0', catalogPrice: 1250.00, total: 1250.00, deliveryTime: 'Inmediata', inStock: true, stockQty: 2 },
      { partida: 6, description: 'V. TERMOSTATICA (Válvula termostática)', brand: 'KAISER / KAESER', quantity: 1, unit: 'pza', partNumber: '7.0399.0', catalogPrice: 2100.00, total: 2100.00, deliveryTime: 'Inmediata', inStock: true, stockQty: 2 },
      { partida: 7, description: 'V. LINEA BARRIDO', brand: 'KAISER / KAESER', quantity: 1, unit: 'pza', partNumber: 'S/N', catalogPrice: 650.00, total: 650.00, deliveryTime: 'Inmediata', inStock: true, stockQty: 6 },
      { partida: 8, description: 'V. ADMISION', brand: 'KAISER / KAESER', quantity: 1, unit: 'pza', partNumber: 'S/N', catalogPrice: 3200.00, total: 3200.00, deliveryTime: 'Inmediata', inStock: true, stockQty: 2 },
      { partida: 9, description: 'LUBRICANTE SINTÉTICO (40 Litros)', brand: 'KAOA467C-05 (OEM KAISER)', quantity: 1, unit: 'cubeta 40L', partNumber: 'KAOA467C-05', catalogPrice: 10353.50, total: 10353.50, deliveryTime: 'Inmediata', inStock: true, stockQty: 15 }
    ]
  },
  {
    id: 'tmpl_kaeser_4k',
    name: 'Preventivo 4,000 hrs Kaeser BSD 50',
    category: 'standard',
    concept: 'Mantenimiento Preventivo 4,000 Horas Kaeser BSD 50',
    brand: 'Kaeser',
    model: 'BSD 50',
    items: [
      { partida: 1, description: 'Filtro de Aire Kaeser 6.2012.0', brand: 'Kaeser', quantity: 1, unit: 'pza', partNumber: '6.2012.0', catalogPrice: 1250, total: 1250, deliveryTime: 'Inmediata', inStock: true, stockQty: 8 },
      { partida: 2, description: 'Filtro de Aceite Kaeser 6.1985.0', brand: 'Kaeser', quantity: 1, unit: 'pza', partNumber: '6.1985.0', catalogPrice: 420, total: 420, deliveryTime: 'Inmediata', inStock: true, stockQty: 10 },
      { partida: 3, description: 'Filtro Separador Kaeser 6.1963.0', brand: 'Kaeser', quantity: 1, unit: 'pza', partNumber: '6.1963.0', catalogPrice: 2650, total: 2650, deliveryTime: 'Inmediata', inStock: true, stockQty: 4 },
      { partida: 4, description: 'Aceite Sigma Fluid S-460 (19L)', brand: 'Kaeser', quantity: 2, unit: 'cubeta', partNumber: 'S-460', catalogPrice: 5400, total: 10800, deliveryTime: 'Inmediata', inStock: true, stockQty: 12 }
    ]
  }
];

export default function SalesQuoteModule({
  clients,
  setClients,
  equipment,
  setEquipment,
  inventory,
  staff,
  workOrders = [],
  setWorkOrders
}: SalesQuoteModuleProps) {
  const [quotes, setQuotes] = useState<Quote[]>(() =>
    loadFromStorage<Quote[]>('mvl_quotes', INITIAL_QUOTES)
  );

  const [quickTemplates, setQuickTemplates] = useState<QuickTemplate[]>(() =>
    loadFromStorage<QuickTemplate[]>('mvl_quick_templates', DEFAULT_TEMPLATES)
  );

  const [activeView, setActiveView] = useState<'list' | 'new_quote' | 'new_client'>('list');
  const [selectedQuoteForPreview, setSelectedQuoteForPreview] = useState<Quote | null>(null);

  // Quote Category: standard | poliza | suministro_instalacion | personalizado
  const [quoteCategory, setQuoteCategory] = useState<'standard' | 'poliza' | 'suministro_instalacion' | 'personalizado'>('standard');

  // Filter & Search states for Quotes List
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'approved' | 'discount_requested' | 'rejected' | 'pending_inventory'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  // 3 Socios de MVL (Emisor Fiscal Seleccionable)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('partner_1');
  const selectedPartner = INITIAL_ISSUER_PARTNERS.find(p => p.id === selectedPartnerId) || INITIAL_ISSUER_PARTNERS[0];

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

  // Service Type Definition & Horometers (2k, 4k, 6k, 8k, 16k, 24k)
  const [serviceTypeCategory, setServiceTypeCategory] = useState<'preventivo' | 'correctivo' | 'predictivo' | 'suministro_refacciones' | 'personalizado'>('preventivo');
  const [serviceHours, setServiceHours] = useState<'2k' | '4k' | '6k' | '8k' | '16k' | '24k' | 'otro'>('4k');
  const [customServicePriceRequested, setCustomServicePriceRequested] = useState(false);
  const [customServiceNotes, setCustomServiceNotes] = useState('');

  // Equipment Technical Data & Attachments (Photo of Plate & Manual PDF)
  const [eqType, setEqType] = useState<'Compresor' | 'Secador' | 'Aire Acondicionado' | 'Otros'>('Compresor');
  const [eqBrand, setEqBrand] = useState('Kaeser');
  const [eqModel, setEqModel] = useState('BSD 50');
  const [eqSerial, setEqSerial] = useState('1030');
  const [eqCapacity, setEqCapacity] = useState('50 HP');
  const [eqVoltage, setEqVoltage] = useState('220V 3F');
  const [eqMode, setEqMode] = useState<'venta' | 'renta' | 'servicio'>('servicio');
  const [isNewEquipmentOnTheFly, setIsNewEquipmentOnTheFly] = useState(false);
  const [dataPlatePhotoUrl, setDataPlatePhotoUrl] = useState<string | null>(null);
  const [manualPdfUrl, setManualPdfUrl] = useState<string | null>(null);

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

  const [supplyScopeList] = useState<string[]>([
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
    '12. Recomendaciones de servicios preventivos posteriores.'
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
  const [deliveryLeadTimeOption, setDeliveryLeadTimeOption] = useState<'auto' | 'inmediato' | 'sobre_pedido' | 'manual'>('auto');
  const [manualDeliveryTime, setManualDeliveryTime] = useState('Inmediata (Existencia en Almacén)');

  // Missing prices list & triggers
  const [missingPrices, setMissingPrices] = useState<{ description: string; partNumber: string; requestedPrice: number }[]>([]);

  // Plant Access Reqs
  const [imssPayment] = useState(true);
  const [imssValidity] = useState(true);
  const [medicalCerts] = useState(true);
  const [riskAssessment] = useState(true);

  // New Client Modal Form
  const [newClientName, setNewClientName] = useState('');
  const [newClientRfc, setNewClientRfc] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [isParticular, setIsParticular] = useState(false);

  // PO Approval Modal State
  const [poApprovalModalQuote, setPoApprovalModalQuote] = useState<Quote | null>(null);
  const [enteredPoNumber, setEnteredPoNumber] = useState('');
  const [poPdfFileName, setPoPdfFileName] = useState('');
  const [autoGenerateOt, setAutoGenerateOt] = useState(true);

  // Save Template Modal State
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Live Inventory Matching suggestions when typing description or part number
  const inventoryMatches = useMemo(() => {
    if (!customItemDesc && !customItemPartNo) return [];
    const query = (customItemDesc || customItemPartNo).toLowerCase().trim();
    if (query.length < 2) return [];
    return inventory.filter(i => 
      i.name.toLowerCase().includes(query) || 
      i.code.toLowerCase().includes(query) ||
      (i.compatibleCodes && i.compatibleCodes.some(c => c.code.toLowerCase().includes(query)))
    ).slice(0, 5);
  }, [customItemDesc, customItemPartNo, inventory]);

  // Auto-calculated Delivery Time based on item stock status
  const calculatedDeliveryTime = useMemo(() => {
    if (deliveryLeadTimeOption === 'inmediato') return 'Inmediata (En Stock Almacén)';
    if (deliveryLeadTimeOption === 'sobre_pedido') return '3 a 5 días hábiles (Sobre Pedido)';
    if (deliveryLeadTimeOption === 'manual') return manualDeliveryTime || 'A convenir';

    const currentItems = quoteCategory === 'standard' || quoteCategory === 'personalizado' ? standardItems :
                         quoteCategory === 'poliza' ? policyItems :
                         [...supplyEquipmentItems, ...supplyElectricalItems];
    
    const hasOutOfStock = currentItems.some(i => i.inStock === false || (i.stockQty !== undefined && i.stockQty < i.quantity));
    return hasOutOfStock ? '3 a 5 días hábiles (Piezas sobre pedido)' : 'Entrega Inmediata (Stock en Almacén)';
  }, [deliveryLeadTimeOption, manualDeliveryTime, quoteCategory, standardItems, policyItems, supplyEquipmentItems, supplyElectricalItems]);

  // Select Item from Inventory Match
  const handleSelectInventoryMatch = (invItem: InventoryItem) => {
    setCustomItemDesc(invItem.name);
    setCustomItemPartNo(invItem.code);
    setCustomItemPrice(invItem.price || 0);
    setCustomItemBrand(invItem.code.includes('K') ? 'Kaeser' : 'MVL');
    setSelectedInventoryId(invItem.id);
  };

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
        catalogPrice: invItem.price || 0,
        total: (invItem.price || 0) * (customItemQty || 1),
        deliveryTime: invItem.stock >= (customItemQty || 1) ? 'Inmediata (Stock)' : '3 a 5 días (Sobre Pedido)',
        inStock: invItem.stock >= (customItemQty || 1),
        stockQty: invItem.stock
      };
      setStandardItems([...standardItems, newItem]);
      setSelectedInventoryId('');
      setCustomItemDesc('');
      setCustomItemPartNo('');
      setCustomItemPrice(0);
      setCustomItemQty(1);
    } else if (customItemDesc) {
      // Check if description exists in inventory
      const matched = inventory.find(i => i.name.toLowerCase() === customItemDesc.toLowerCase() || i.code.toLowerCase() === customItemPartNo.toLowerCase());
      const hasStock = matched ? matched.stock >= (customItemQty || 1) : false;
      const newItem: QuoteItem = {
        partida: standardItems.length + 1,
        description: customItemDesc,
        brand: customItemBrand,
        quantity: customItemQty || 1,
        unit: customItemUnit || 'pza',
        partNumber: customItemPartNo || (matched?.code || 'S/N'),
        catalogPrice: Number(customItemPrice) || (matched?.price || 0),
        total: (Number(customItemPrice) || (matched?.price || 0)) * (customItemQty || 1),
        deliveryTime: hasStock ? 'Inmediata (Stock)' : 'A cotizar / Sobre pedido',
        inStock: hasStock,
        stockQty: matched?.stock || 0,
        isCustomPriceRequest: Number(customItemPrice) === 0 && (!matched || matched.price === 0)
      };
      setStandardItems([...standardItems, newItem]);
      if (Number(customItemPrice) === 0 && (!matched || matched.price === 0)) {
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

  // Load a Quick Template
  const handleLoadTemplate = (tmpl: QuickTemplate) => {
    setQuoteCategory(tmpl.category);
    setStandardItems(tmpl.items.map((it, idx) => ({ ...it, partida: idx + 1 })));
    setConcept(tmpl.concept);
    if (tmpl.brand) setEqBrand(tmpl.brand);
    if (tmpl.model) setEqModel(tmpl.model);
  };

  // Save current quote as a new Quick Template
  const handleSaveAsTemplate = () => {
    if (!newTemplateName.trim()) return;
    const newTmpl: QuickTemplate = {
      id: 'tmpl_' + Date.now(),
      name: newTemplateName.trim(),
      category: quoteCategory,
      concept: concept || `Plantilla ${newTemplateName}`,
      brand: eqBrand,
      model: eqModel,
      items: quoteCategory === 'standard' || quoteCategory === 'personalizado' ? standardItems :
             quoteCategory === 'poliza' ? policyItems :
             [...supplyEquipmentItems, ...supplyElectricalItems]
    };
    const updated = [newTmpl, ...quickTemplates];
    setQuickTemplates(updated);
    saveToStorage('mvl_quick_templates', updated);
    setShowSaveTemplateModal(false);
    setNewTemplateName('');
  };

  const handleDuplicateQuote = (q: Quote) => {
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
      setEqSerial(q.equipmentDetails.serialNumber || '1030');
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

    if (q.issuerPartnerId) {
      setSelectedPartnerId(q.issuerPartnerId);
    }
    if (q.serviceHours) {
      setServiceHours(q.serviceHours as any);
    }
    if (q.equipmentPlatePhotoUrl) {
      setDataPlatePhotoUrl(q.equipmentPlatePhotoUrl);
    }
    if (q.equipmentManualPdfUrl) {
      setManualPdfUrl(q.equipmentManualPdfUrl);
    }

    setActiveView('new_quote');
  };

  const handleSaveQuote = (e: React.FormEvent, isDraftOrPendingInventory = false) => {
    e.preventDefault();

    let rawSubtotal = 0;
    let itemsToSave: QuoteItem[] = [];

    if (quoteCategory === 'standard' || quoteCategory === 'personalizado') {
      itemsToSave = standardItems;
      rawSubtotal = standardItems.reduce((sum, item) => sum + item.total, 0);
    } else if (quoteCategory === 'poliza') {
      itemsToSave = policyItems;
      rawSubtotal = policyItems.reduce((sum, item) => sum + item.total, 0);
    } else if (quoteCategory === 'suministro_instalacion') {
      itemsToSave = [...supplyEquipmentItems, ...supplyElectricalItems];
      rawSubtotal = itemsToSave.reduce((sum, item) => sum + item.total, 0);
    }

    const discountAmount = rawSubtotal * (discountPercent / 100);
    const subtotalWithDiscount = rawSubtotal - discountAmount;
    const tax = subtotalWithDiscount * 0.16;
    const total = subtotalWithDiscount + tax;

    const folNum = quoteCategory === 'poliza' ? `${Date.now().toString().slice(-6)}GNG` :
                   quoteCategory === 'suministro_instalacion' ? `M2-${quotes.length + 1000}-GNG` :
                   `COT-2026-0${quotes.length + 1}`;

    const defaultConcept = quoteCategory === 'poliza'
      ? `Cotización de Póliza de Mantenimiento Anual Equipos de Climatización (${policyType === 'poliza_a' ? 'Póliza Tipo A - Reparaciones no incluidas' : 'Póliza Tipo B - Reparaciones incluidas'})`
      : quoteCategory === 'suministro_instalacion'
      ? `Cotización de Suministro e Instalación de Mini Split YORK y Canalización Eléctrica`
      : `Servicio ${serviceTypeCategory.toUpperCase()} (${serviceTypeCategory === 'preventivo' ? serviceHours + ' Horas' : 'Especial'}) - ${eqType} ${eqBrand} ${eqModel}`;

    const finalStatus: Quote['status'] = isDraftOrPendingInventory 
      ? 'pending_inventory' 
      : discountPercent > 5 ? 'discount_requested' : 'sent';

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
      status: finalStatus,
      quoteType,
      quoteOrigin,
      quoteCategory,
      issuerPartnerId: selectedPartner.id,
      issuerPartnerName: selectedPartner.name,
      issuerPartnerRfc: selectedPartner.rfc,
      issuerPartnerBusinessName: selectedPartner.businessName,
      issuerSignatureName: selectedPartner.roleDescription,
      serviceHours: serviceTypeCategory === 'preventivo' ? serviceHours : undefined,
      equipmentPlatePhotoUrl: dataPlatePhotoUrl || undefined,
      equipmentManualPdfUrl: manualPdfUrl || undefined,
      policyType,
      serviceTypeCategory,
      customServicePriceRequested,
      publicClientName,
      discountRequested: discountPercent > 0 ? discountPercent : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
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
        riskAssessmentForm: riskAssessment
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

    // If "Dar de alta nuevo equipo al vuelo" or new equipment specs, register equipment
    if (isNewEquipmentOnTheFly && setEquipment) {
      const newEq: Equipment = {
        id: 'eq_' + Date.now(),
        clientId: selectedClientId,
        plantId: selectedClient?.plants?.[0]?.id || 'p_1',
        name: `${eqBrand} ${eqModel}`,
        brand: eqBrand,
        model: eqModel,
        serialNumber: eqSerial || `SN-${Date.now().toString().slice(-4)}`,
        capacity: eqCapacity,
        voltage: eqVoltage,
        filtersRequired: 'Kit estándar',
        engineHours: serviceHours === '2k' ? 2000 : serviceHours === '4k' ? 4000 : serviceHours === '6k' ? 6000 : serviceHours === '8k' ? 8000 : serviceHours === '16k' ? 16000 : serviceHours === '24k' ? 24000 : 1000,
        oilType: 'Sintético S-460',
        lastMaintenance: new Date().toISOString().split('T')[0],
        nextMaintenance: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        status: 'active',
        dataPlatePhotoUrl: dataPlatePhotoUrl || undefined
      };
      setEquipment(prev => {
        const updatedEq = [newEq, ...prev];
        saveToStorage('mvl_equipment', updatedEq);
        return updatedEq;
      });
    }

    const updated = [newQ, ...quotes];
    setQuotes(updated);
    saveToStorage('mvl_quotes', updated);
    setActiveView('list');
    setSelectedQuoteForPreview(newQ);
  };

  // Change quote status & trigger pre-billing request if approved
  const handleConfirmPoApproval = () => {
    if (!poApprovalModalQuote) return;

    const quoteId = poApprovalModalQuote.id;
    const poNum = enteredPoNumber.trim() || `OC-${Date.now().toString().slice(-5)}`;
    const poUrl = poPdfFileName ? `ordenes_compra/${poPdfFileName}` : 'ordenes_compra/OC_FIRMADA_CLIENTE.pdf';

    const updated = quotes.map(q => {
      if (q.id === quoteId) {
        return {
          ...q,
          status: 'approved' as const,
          clientPoNumber: poNum,
          poPdfUrl: poUrl,
          poApprovalDate: new Date().toISOString().split('T')[0],
          poApprovalStatus: 'approved' as const,
          preBillingRequest: {
            requestedAt: new Date().toISOString().split('T')[0],
            status: 'pending' as const,
            creditDays: 30
          }
        };
      }
      return q;
    });

    setQuotes(updated);
    saveToStorage('mvl_quotes', updated);

    // Auto-generate Work Order (OT)
    if (autoGenerateOt && setWorkOrders) {
      const q = poApprovalModalQuote;
      const targetEq = equipment.find(eq => eq.clientId === q.clientId) || equipment[0];
      const newOTCode = `OT-${1000 + (workOrders?.length || 0) + 1}`;

      const newOT: WorkOrder = {
        id: `ot_${Date.now()}`,
        code: newOTCode,
        equipmentId: targetEq?.id || 'eq1',
        clientId: q.clientId,
        plantId: targetEq?.plantId || 'p_1',
        type: q.serviceTypeCategory === 'correctivo' ? 'corrective' : 'preventive',
        status: 'pending',
        scheduledDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        engineHours: q.serviceHours === '2k' ? 2000 : q.serviceHours === '4k' ? 4000 : q.serviceHours === '6k' ? 6000 : q.serviceHours === '8k' ? 8000 : q.serviceHours === '16k' ? 16000 : q.serviceHours === '24k' ? 24000 : 3500,
        assignedTechnicianId: staff[1]?.id || 's2',
        assignedTechnicianName: staff[1]?.name || 'Ing. Roberto Sánchez',
        checklist: [
          { id: 'c1', task: `Inspección física y validación de No. Serie (${q.equipmentDetails?.serialNumber || '1030'})`, checked: false },
          { id: 'c2', task: `Sustitución de refacciones autorizadas bajo ${q.folNum} (OC: ${poNum})`, checked: false },
          { id: 'c3', task: 'Lectura de controladores, presiones y temperatura de descarga', checked: false },
          { id: 'c4', task: 'Prueba de arranque y toma de firmas con cliente', checked: false }
        ],
        observations: `OT generada automáticamente desde Cotización ${q.folNum} (Orden de Compra: ${poNum}). Concepto: ${q.concept}`,
        partsUsed: q.itemsTable?.map(item => ({
          itemId: 'inv1',
          name: item.description,
          quantity: item.quantity,
          price: item.catalogPrice
        })) || []
      };

      setWorkOrders(prev => {
        const nextOTs = [newOT, ...prev];
        saveToStorage('mvl_work_orders', nextOTs);
        return nextOTs;
      });
    }

    setPoApprovalModalQuote(null);
    setEnteredPoNumber('');
    setPoPdfFileName('');
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

  // WhatsApp Message Generator
  const generateWhatsAppUrl = (q: Quote) => {
    const phone = (q.whatsapp || '4774047421').replace(/\D/g, '');
    const cleanPhone = phone.length === 10 ? `52${phone}` : phone;
    const msg = `*MVL CONTROL INDUSTRIAL - COTIZACIÓN OFICIAL*\n\n` +
      `Estimado cliente: *${q.clientName}*\n` +
      `Folio: *${q.folNum}*\n` +
      `Concepto: *${q.concept}*\n` +
      `Total: *$${q.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN* (IVA Incluido)\n` +
      `Tiempo de Entrega: *${q.deliveryLeadTime || 'Inmediata'}*\n` +
      `Asesor: *${q.agentName || 'Ing. Leonardo Daniel Torres'}*\n` +
      `Razón Social: *${q.issuerPartnerBusinessName || 'MVL Control y Mantenimiento'}*\n\n` +
      `Consulte el expediente digital y formato oficial en nuestra plataforma web.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  // Download PDF with custom filename [Numero_Cotizacion]_[Descripcion].pdf
  const handleDownloadPdf = (q: Quote) => {
    const sanitizedConcept = q.concept.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    const fileName = `${q.folNum}_${sanitizedConcept}.pdf`;
    const prevTitle = document.title;
    document.title = fileName;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1000);
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
                  placeholder="477-123-4567"
                  value={newClientPhone}
                  onChange={e => setNewClientPhone(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#0196C1] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Correo Electrónico de Facturación / Contacto</label>
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
                id="isPart"
                checked={isParticular}
                onChange={e => setIsParticular(e.target.checked)}
                className="rounded text-[#0196C1]"
              />
              <label htmlFor="isPart" className="text-xs text-slate-600 font-medium">Cliente particular / No requiere factura comercial</label>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveView('list')}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Guardar Cliente y Cotizar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: Create New Dynamic Quote */}
      {activeView === 'new_quote' && (
        <form onSubmit={e => handleSaveQuote(e, false)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase text-[#0196C1] tracking-wider">
                {quoteCategory === 'standard' ? 'Cotización Estándar de Refacciones & Servicio' :
                 quoteCategory === 'poliza' ? 'Cotización de Póliza Anual HVAC' :
                 quoteCategory === 'suministro_instalacion' ? 'Cotización Suministro e Instalación YORK' : 'Cotización Personalizada'}
              </span>
              <h3 className="text-base font-black text-slate-800">
                Nueva Propuesta Económica & Cotización Formal MVL
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(true)}
                className="px-3 py-1.5 bg-sky-50 text-[#0196C1] border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-sky-100 cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5" /> Guardar como Plantilla
              </button>
              <button
                type="button"
                onClick={() => setActiveView('list')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg bg-slate-100 cursor-pointer"
              >
                Cerrar Formulario
              </button>
            </div>
          </div>

          {/* Plantillas Rápidas Dinámicas */}
          <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#0196C1]" /> Plantillas Rápidas & Historial de Partidas
              </label>
              <span className="text-[10px] text-slate-500 font-bold">{quickTemplates.length} plantillas disponibles</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickTemplates.map(tmpl => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleLoadTemplate(tmpl)}
                  className="px-3 py-1.5 bg-white hover:bg-sky-50 border border-slate-200 hover:border-[#0196C1] rounded-xl text-xs font-bold text-slate-700 hover:text-[#0196C1] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-[#0196C1]" />
                  <span>{tmpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 1. SELECCIÓN DE ORIGEN, TIPO DE CLIENTE & SOCIO EMISOR */}
          <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#0196C1]" /> 1. Socio Emisor MVL & Clasificación de Cliente
              </label>
              <button
                type="button"
                onClick={() => setActiveView('new_client')}
                className="text-[10px] font-extrabold text-[#0196C1] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> + Registrar Nuevo Cliente
              </button>
            </div>

            {/* Selector de Razón Social / Socio Emisor */}
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#0196C1]" /> Razón Social Emisora (3 Socios Registrados):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {INITIAL_ISSUER_PARTNERS.map(partner => (
                  <button
                    key={partner.id}
                    type="button"
                    onClick={() => setSelectedPartnerId(partner.id)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedPartnerId === partner.id
                        ? 'bg-sky-50/60 border-[#0196C1] text-slate-900 ring-1 ring-[#0196C1]'
                        : 'bg-slate-50/50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">{partner.name}</span>
                      {selectedPartnerId === partner.id && <Check className="w-3.5 h-3.5 text-[#0196C1]" />}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 block">RFC: {partner.rfc}</span>
                    <span className="text-[9px] text-slate-400 block truncate">{partner.taxRegime}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setQuoteOrigin('registrado')}
                className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  quoteOrigin === 'registrado' ? 'bg-[#0196C1] text-white border-[#0196C1] shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Cliente Registrado
              </button>
              <button
                type="button"
                onClick={() => setQuoteOrigin('nuevo')}
                className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  quoteOrigin === 'nuevo' ? 'bg-[#0196C1] text-white border-[#0196C1] shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> + Cliente Nuevo
              </button>
              <button
                type="button"
                onClick={() => setQuoteOrigin('publico_general')}
                className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  quoteOrigin === 'publico_general' ? 'bg-[#0196C1] text-white border-[#0196C1] shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> Venta Público General
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {quoteOrigin !== 'publico_general' ? (
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Cliente</label>
                  <select
                    value={selectedClientId}
                    onChange={e => setSelectedClientId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.rfc})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Nombre / Razón Social Comprador</label>
                  <input
                    type="text"
                    required
                    placeholder="Público General / Nombre del cliente"
                    value={publicClientName}
                    onChange={e => setPublicClientName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold"
                  />
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
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Asesor Responsable</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-[#0196C1]"
                />
              </div>
            </div>
          </div>

          {/* 2. DEFINICIÓN DEL SERVICIO, REQUERIMIENTO & HORAS DE SERVICIO */}
          <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-3">
            <label className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#0196C1]" /> 2. Tipo de Servicio & Horómetro de Operación
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'preventivo', label: 'Preventivo', desc: 'Horómetros programados' },
                { id: 'correctivo', label: 'Correctivo', desc: 'Reparación / Falla' },
                { id: 'predictivo', label: 'Predictivo', desc: 'Termografía / Aceite' },
                { id: 'suministro_refacciones', label: 'Suministro', desc: 'Venta de refacciones' },
                { id: 'personalizado', label: 'Personalizado', desc: 'Tarifa especial libre' }
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

            {/* Selector de Horómetros para Servicio Preventivo (2k, 4k, 6k, 8k, 16k, 24k hrs) */}
            {serviceTypeCategory === 'preventivo' && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black text-slate-600 uppercase flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#0196C1]" /> Horas de Servicio del Equipo (Horómetro):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {[
                    { id: '2k', label: '2,000 hrs', desc: 'Filtros y Aceite Básico' },
                    { id: '4k', label: '4,000 hrs', desc: 'Mantenimiento Preventivo Menor' },
                    { id: '6k', label: '6,000 hrs', desc: 'Preventivo + Válvula Termostática' },
                    { id: '8k', label: '8,000 hrs', desc: 'Mantenimiento Mayor / Kit Válvulas' },
                    { id: '16k', label: '16,000 hrs', desc: 'Overhaul Integral y Rodamientos' },
                    { id: '24k', label: '24,000 hrs', desc: 'Overhaul Mayor y Rodamientos (24k)' }
                  ].map(h => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setServiceHours(h.id as any)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-start ${
                        serviceHours === h.id
                          ? 'bg-sky-50 border-[#0196C1] text-[#0196C1] ring-1 ring-[#0196C1]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-black">{h.label}</span>
                      <span className="text-[9px] font-normal text-slate-400 leading-tight">{h.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. ASIGNACIÓN, DATOS DE EQUIPOS Y ADJUNTOS (FOTO DE PLACA, SERIE & MANUAL PDF) */}
          <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#0196C1]" /> 3. Datos Técnicos del Equipo, No. de Serie & Adjuntos
              </label>
              <button
                type="button"
                onClick={() => setIsNewEquipmentOnTheFly(!isNewEquipmentOnTheFly)}
                className={`text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                  isNewEquipmentOnTheFly ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-50 text-[#0196C1] hover:bg-sky-100'
                }`}
              >
                <Plus className="w-3 h-3" /> {isNewEquipmentOnTheFly ? '✓ Guardando en Catálogo de Equipos' : 'Dar de alta nuevo equipo al vuelo'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Tipo de Equipo</label>
                <select
                  value={eqType}
                  onChange={e => setEqType(e.target.value as any)}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-800"
                >
                  <option value="Compresor">Compresor Tornillo</option>
                  <option value="Secador">Secador Refrigerativo</option>
                  <option value="Aire Acondicionado">Aire Acondicionado</option>
                  <option value="Otros">Bomba Vacío / Chiller</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Marca</label>
                <input
                  type="text"
                  value={eqBrand}
                  onChange={e => setEqBrand(e.target.value)}
                  placeholder="Kaeser, York..."
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Modelo</label>
                <input
                  type="text"
                  value={eqModel}
                  onChange={e => setEqModel(e.target.value)}
                  placeholder="BSD 50, AS 30 T..."
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-[#0196C1]" /> No. de Serie / Placa
                </label>
                <input
                  type="text"
                  value={eqSerial}
                  onChange={e => setEqSerial(e.target.value)}
                  placeholder="Ej. 1030, SN-88921"
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Capacidad</label>
                <input
                  type="text"
                  value={eqCapacity}
                  onChange={e => setEqCapacity(e.target.value)}
                  placeholder="50 HP / 1.5 TR"
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Voltaje</label>
                <input
                  type="text"
                  value={eqVoltage}
                  onChange={e => setEqVoltage(e.target.value)}
                  placeholder="220V 3F, 440V"
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                />
              </div>
            </div>

            {/* ADJUNTOS TÉCNICOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-700 uppercase flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#0196C1]" /> Foto de Placa de Datos
                  </span>
                  {dataPlatePhotoUrl && (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> Placa Adjunta
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed rounded-xl cursor-pointer text-center text-[10px] font-bold text-slate-600 flex items-center justify-center gap-1.5 transition-all">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dataPlatePhotoUrl ? 'Cambiar Foto de Placa' : 'Subir Foto de Placa (JPG/PNG)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setDataPlatePhotoUrl(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                  {dataPlatePhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setDataPlatePhotoUrl(null)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                      title="Eliminar foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-700 uppercase flex items-center gap-1.5">
                    <FileDown className="w-3.5 h-3.5 text-[#0196C1]" /> Manual Técnico / Guía PDF
                  </span>
                  {manualPdfUrl && (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> PDF Vinculado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed rounded-xl cursor-pointer text-center text-[10px] font-bold text-slate-600 flex items-center justify-center gap-1.5 transition-all">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>{manualPdfUrl ? 'Cambiar Manual Técnico PDF' : 'Adjuntar Manual / Despiece (PDF)'}</span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setManualPdfUrl(`manuales/${file.name}`);
                        }
                      }}
                    />
                  </label>
                  {manualPdfUrl && (
                    <button
                      type="button"
                      onClick={() => setManualPdfUrl(null)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                      title="Eliminar manual"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. PARTIDAS DE REFACCIONES & LINKEADO AUTOMÁTICO A INVENTARIO */}
          {quoteCategory === 'standard' && (
            <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-[#0196C1]" /> 4. Partidas de Refacciones (Búsqueda Automática en Stock)
                </label>
                <span className="text-[10px] font-extrabold text-[#0196C1] bg-sky-50 px-2 py-0.5 rounded">
                  {standardItems.length} Partidas agregadas
                </span>
              </div>

              {/* Captura con Auto-Complete en Inventario */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Escribe descripción o No. de Parte para verificar en Almacén:</span>
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                  <div className="sm:col-span-2 relative">
                    <input
                      type="text"
                      placeholder="Ej. Filtro de aire, aceite, válvula..."
                      value={customItemDesc}
                      onChange={e => setCustomItemDesc(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold"
                    />
                    {/* Live suggestions */}
                    {inventoryMatches.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100">
                        {inventoryMatches.map(inv => (
                          <button
                            key={inv.id}
                            type="button"
                            onClick={() => handleSelectInventoryMatch(inv)}
                            className="w-full p-2.5 text-left text-xs hover:bg-sky-50 flex items-center justify-between cursor-pointer"
                          >
                            <div>
                              <span className="font-bold text-slate-800 block">{inv.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">Código: {inv.code}</span>
                            </div>
                            <div className="text-right">
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded block ${inv.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                {inv.stock > 0 ? `Stock: ${inv.stock} pzas` : 'Sobre Pedido'}
                              </span>
                              <span className="text-[10px] font-bold text-[#0196C1]">${inv.price?.toLocaleString('es-MX')} MXN</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="No. Parte / Código"
                    value={customItemPartNo}
                    onChange={e => setCustomItemPartNo(e.target.value)}
                    className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono"
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
                      <th className="py-2 px-2.5 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {standardItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-2.5 font-bold text-slate-500">{item.partida}</td>
                        <td className="py-2 px-2.5 font-bold text-slate-800">{item.description}</td>
                        <td className="py-2 px-2.5 font-mono text-slate-500">{item.partNumber}</td>
                        <td className="py-2 px-2.5">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${item.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {item.inStock ? `✓ En Stock (${item.stockQty || 1})` : '⏳ Sobre Pedido'}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 font-bold">{item.quantity}</td>
                        <td className="py-2 px-2.5 text-right">${item.catalogPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-2.5 text-right font-black text-slate-900">${item.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveStandardItem(idx)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. CONDICIONES COMERCIALES, TIEMPO DE ENTREGA & DESCUENTOS */}
          <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-4">
            <label className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#0196C1]" /> 5. Tiempo de Entrega & Condiciones Comerciales
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Delivery Time Selection */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black text-slate-600 uppercase block">Cálculo y Edición de Tiempo de Entrega:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryLeadTimeOption('auto')}
                    className={`p-2 rounded-lg border text-left text-xs font-bold cursor-pointer ${
                      deliveryLeadTimeOption === 'auto' ? 'bg-sky-50 border-[#0196C1] text-[#0196C1] ring-1 ring-[#0196C1]' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <span>Auto (Por Stock)</span>
                    <span className="text-[9px] font-normal text-slate-400 block">{calculatedDeliveryTime}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryLeadTimeOption('manual')}
                    className={`p-2 rounded-lg border text-left text-xs font-bold cursor-pointer ${
                      deliveryLeadTimeOption === 'manual' ? 'bg-sky-50 border-[#0196C1] text-[#0196C1] ring-1 ring-[#0196C1]' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <span>Manual / Personalizado</span>
                    <span className="text-[9px] font-normal text-slate-400 block">Editar a mano</span>
                  </button>
                </div>

                {deliveryLeadTimeOption === 'manual' && (
                  <div className="pt-2">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Escribir Tiempo de Entrega Personalizado:</label>
                    <input
                      type="text"
                      value={manualDeliveryTime}
                      onChange={e => setManualDeliveryTime(e.target.value)}
                      placeholder="Ej. Inmediata (Existencia en Almacén) / 2 a 3 semanas"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Discount selection */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black text-slate-600 uppercase block">Descuento Comercial Aplicado (%):</span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={discountPercent}
                    onChange={e => setDiscountPercent(Number(e.target.value))}
                    className="w-24 text-sm p-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-slate-800 outline-none"
                  />
                  <span className="text-xs text-slate-500">
                    {discountPercent > 5 ? '⚠️ Requiere autorización de Dirección / Socios.' : '✓ Descuento estándar de vendedor.'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN: GUARDAR COTIZACIÓN & GUARDAR COMO BORRADOR/PENDIENTE DE INVENTARIO */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={e => handleSaveQuote(e, true)}
              className="px-5 py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
            >
              <Clock className="w-4 h-4 text-amber-600" /> Guardar como Borrador / Pendiente de Inventario
            </button>

            <button
              type="submit"
              className="flex-1 py-3 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" /> Generar, Firmar y Emitir Cotización Oficial MVL
            </button>
          </div>
        </form>
      )}

      {/* VIEW: List of Quotes */}
      {activeView === 'list' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Historial & Expediente de Cotizaciones</h3>
              <p className="text-[11px] text-slate-400">Filtrables por vendedor, estatus y cliente con duplicación y aprobación con Orden de Compra (OC)</p>
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
                <option value="approved">Aprobada con OC</option>
                <option value="pending_inventory">⏳ Pendiente de Inventario</option>
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

                    {q.status === 'pending_inventory' && (
                      <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" /> Pendiente de Inventario
                      </span>
                    )}

                    {q.clientPoNumber && (
                      <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> OC: {q.clientPoNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-700">{q.concept}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span>Emisor: <strong>{q.issuerPartnerName || 'MVL Control'}</strong></span>
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
                    {/* Botón Aprobar con OC */}
                    {q.status !== 'approved' && (
                      <button
                        onClick={() => setPoApprovalModalQuote(q)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" /> Aprobar con OC
                      </button>
                    )}

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
                      href={generateWhatsAppUrl(q)}
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

      {/* PO APPROVAL MODAL (Upload PDF & Generate OT) */}
      {poApprovalModalQuote && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Aprobación de Cotización & Registro de OC
              </h3>
              <button onClick={() => setPoApprovalModalQuote(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-xs">
              <span className="font-bold text-[#0196C1] block">Folio: {poApprovalModalQuote.folNum}</span>
              <span className="text-slate-700 block">{poApprovalModalQuote.clientName}</span>
              <span className="font-black text-slate-900 block mt-1">${poApprovalModalQuote.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Número de Orden de Compra del Cliente (OC)</label>
                <input
                  type="text"
                  placeholder="Ej. OC-2026-8819, PO-9941"
                  value={enteredPoNumber}
                  onChange={e => setEnteredPoNumber(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Subir Orden de Compra (PDF / Foto)</label>
                <label className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed rounded-xl cursor-pointer text-center text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>{poPdfFileName || 'Seleccionar archivo PDF de OC'}</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) setPoPdfFileName(file.name);
                    }}
                  />
                </label>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoOt"
                  checked={autoGenerateOt}
                  onChange={e => setAutoGenerateOt(e.target.checked)}
                  className="rounded text-[#0196C1]"
                />
                <label htmlFor="autoOt" className="text-xs text-slate-700 font-bold">Generar Orden de Trabajo (OT) automática para Coordinación</label>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPoApprovalModalQuote(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPoApproval}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer"
              >
                Confirmar y Generar OT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVE TEMPLATE MODAL */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              <BookmarkPlus className="w-4 h-4 text-[#0196C1]" />
              Guardar Plantilla Rápida
            </h3>
            <p className="text-xs text-slate-500">Asigna un nombre a este paquete de refacciones para reutilizarlo en futuras cotizaciones.</p>
            <input
              type="text"
              placeholder="Ej. Preventivo Kaeser CSD 75, Minisplit YORK..."
              value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                className="flex-1 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Guardar Plantilla
              </button>
            </div>
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
                  onClick={() => handleDownloadPdf(selectedQuoteForPreview)}
                  className="px-3 py-1.5 bg-[#0196C1] hover:bg-[#017fa4] text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Descargar PDF / Imprimir
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
              {/* PDF HEADER CON LOGOTIPO INSTITUCIONAL */}
              <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-linear-to-br from-[#0196C1] to-[#017fa4] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white">
                      MVL
                    </div>
                    <div>
                      <h1 className="text-base font-black text-slate-900 tracking-tight">
                        {selectedQuoteForPreview.issuerPartnerBusinessName || 'MVL Control y Mantenimiento'}
                      </h1>
                      <p className="text-[10px] text-slate-700 font-bold">
                        Razón Social: {selectedQuoteForPreview.issuerPartnerName || 'Víctor Pedro Ramírez Barrios'} | RFC: <span className="font-mono">{selectedQuoteForPreview.issuerPartnerRfc || 'RABV891002TF6'}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">RÉGIMEN FISCAL: 612 Personas Físicas con Actividades Empresariales y Profesionales / MVL Maquinaria</p>
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

              {/* CLIENT & SERVICE INFO BOX */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Cliente / Razón Social</span>
                  <span className="text-xs font-bold text-slate-800">{selectedQuoteForPreview.clientName}</span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Empresa / Sucursal</span>
                  <span className="text-xs font-bold text-slate-800">{selectedQuoteForPreview.plantName || 'Planta Principal'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Horómetro / Servicio</span>
                  <span className="text-xs font-bold text-[#0196C1]">
                    {selectedQuoteForPreview.serviceHours ? `${selectedQuoteForPreview.serviceHours} Horas Operación` : (selectedQuoteForPreview.serviceTypeCategory?.toUpperCase() || 'Estándar')}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Tiempo de Entrega</span>
                  <span className="text-xs font-bold text-emerald-700">{selectedQuoteForPreview.deliveryLeadTime || 'Inmediata'}</span>
                </div>
              </div>

              {/* DATOS TÉCNICOS Y SERIE DEL EQUIPO */}
              {selectedQuoteForPreview.equipmentDetails && (
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Equipo / Marca</span>
                    <span className="font-bold text-slate-800">{selectedQuoteForPreview.equipmentDetails.brand} {selectedQuoteForPreview.equipmentDetails.model}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase block">No. de Serie</span>
                    <span className="font-mono font-black text-[#0196C1]">{selectedQuoteForPreview.equipmentDetails.serialNumber || '1030'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Capacidad / Voltaje</span>
                    <span className="font-bold text-slate-800">{selectedQuoteForPreview.equipmentDetails.capacity || '50 HP'} - {selectedQuoteForPreview.equipmentDetails.voltage || '220V'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Tipo</span>
                    <span className="font-bold text-slate-800">{selectedQuoteForPreview.equipmentDetails.equipmentType || 'Compresor'}</span>
                  </div>
                </div>
              )}

              {/* TECHNICAL ATTACHMENTS BADGES (IF ANY) */}
              {(selectedQuoteForPreview.equipmentPlatePhotoUrl || selectedQuoteForPreview.equipmentManualPdfUrl) && (
                <div className="flex flex-wrap gap-2 p-2.5 bg-sky-50/50 rounded-xl border border-sky-100 text-xs">
                  <span className="text-[10px] font-black text-slate-600 uppercase flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5 text-[#0196C1]" /> Anexos Técnicos:
                  </span>
                  {selectedQuoteForPreview.equipmentPlatePhotoUrl && (
                    <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold flex items-center gap-1">
                      <Camera className="w-3 h-3 text-[#0196C1]" /> Foto de Placa de Equipo Validada
                    </span>
                  )}
                  {selectedQuoteForPreview.equipmentManualPdfUrl && (
                    <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold flex items-center gap-1">
                      <FileDown className="w-3 h-3 text-purple-600" /> Manual Técnico / Guía de Despiece en Expediente
                    </span>
                  )}
                </div>
              )}

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

              {/* TOTALS SUMMARY BOX CON DESCUENTO VISIBLE */}
              <div className="flex justify-end pt-2">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-full sm:w-80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold">${selectedQuoteForPreview.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                  </div>

                  {selectedQuoteForPreview.discountRequested && selectedQuoteForPreview.discountRequested > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      <span>Descuento Comercial ({selectedQuoteForPreview.discountRequested}%):</span>
                      <span>Aplicado</span>
                    </div>
                  )}

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

              {/* SIGNATURE AREA WITH DIGITAL SIGNATURE DINÁMICA DEL SOCIO EMISOR */}
              <div className="pt-6 border-t border-slate-200 flex flex-col items-center justify-center text-center space-y-1">
                <div className="font-serif italic text-lg text-slate-700 font-bold border-b border-slate-300 pb-1 px-8">
                  {selectedQuoteForPreview.issuerPartnerName || selectedQuoteForPreview.agentName || 'Ing. Leonardo Daniel Torres Ojeda'}
                </div>
                <p className="text-xs font-bold text-slate-800">
                  {selectedQuoteForPreview.issuerSignatureName || 'Firma Digital Válida / Representante Autorizado MVL'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {selectedQuoteForPreview.issuerPartnerBusinessName || 'MVL Control y Mantenimiento'} | RFC: {selectedQuoteForPreview.issuerPartnerRfc || 'RABV891002TF6'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Search Engine for HinchMart Seller Portal
 * Provides high-performance prefix, suffix, and contains matching across:
 * - Orders (Order numbers, buyer company/name, product items, status)
 * - Invoices (Tax invoice numbers, order references, buyer company)
 * - Customers (Company name, contact person, city, phone, GSTIN)
 * - Products (Product name, SKU, brand, category, subcategory, HSN)
 * - Quotations (Quotation numbers, buyer company, status)
 */

/**
 * Normalizes text for case-insensitive and trimmed comparison
 */
export function normalizeSearchTerm(str) {
  return String(str || '').toLowerCase().trim();
}

/**
 * Evaluates whether any candidate string in `fieldValues` matches the search query.
 * Implements prefix matching, suffix matching, word-token matching, and relevance scoring.
 * 
 * @param {Array<string>} fieldValues - List of strings from the record
 * @param {string} cleanQuery - Normalized query string
 * @returns {{ isMatch: boolean, score: number, matchedField: string }}
 */
export function evaluateSearchMatch(fieldValues, query) {
  const cleanQuery = normalizeSearchTerm(query);
  if (!cleanQuery) return { isMatch: false, score: 0, matchedField: '' };

  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);
  const alphaQuery = cleanQuery.replace(/[^a-z0-9]/gi, '');

  let isMatch = false;
  let highestScore = 0;
  let matchedField = '';

  for (const rawVal of fieldValues) {
    if (rawVal === undefined || rawVal === null) continue;
    const str = String(rawVal).trim().toLowerCase();
    if (!str) continue;

    const alphaStr = str.replace(/[^a-z0-9]/gi, '');

    // 1. Exact Match (Score: 100)
    if (str === cleanQuery || (alphaQuery && alphaStr === alphaQuery)) {
      isMatch = true;
      if (highestScore < 100) {
        highestScore = 100;
        matchedField = str;
      }
      continue;
    }

    // 2. Exact Prefix Match - entire string starts with query (Score: 90)
    if (str.startsWith(cleanQuery) || (alphaQuery && alphaQuery.length >= 2 && alphaStr.startsWith(alphaQuery))) {
      isMatch = true;
      if (highestScore < 90) {
        highestScore = 90;
        matchedField = str;
      }
      continue;
    }

    // 3. Word-level Prefix / Exact / Suffix Matches (Score: 70 - 85)
    const words = str.split(/[\s\-_/.,+()@:]+/).filter(Boolean);
    let wordHit = false;

    for (const w of words) {
      if (w === cleanQuery) {
        isMatch = true;
        wordHit = true;
        if (highestScore < 85) {
          highestScore = 85;
          matchedField = w;
        }
      } else if (w.startsWith(cleanQuery)) {
        isMatch = true;
        wordHit = true;
        if (highestScore < 78) {
          highestScore = 78;
          matchedField = w;
        }
      } else if (w.endsWith(cleanQuery)) {
        isMatch = true;
        wordHit = true;
        if (highestScore < 72) {
          highestScore = 72;
          matchedField = w;
        }
      }
    }

    if (wordHit) continue;

    // 4. Substring / Suffix / Contains Match (Score: 50 - 65)
    if (str.includes(cleanQuery) || (alphaQuery && alphaQuery.length >= 3 && alphaStr.includes(alphaQuery))) {
      isMatch = true;
      const isSuffix = str.endsWith(cleanQuery) || (alphaQuery && alphaStr.endsWith(alphaQuery));
      const score = isSuffix ? 65 : 55;
      if (highestScore < score) {
        highestScore = score;
        matchedField = str;
      }
      continue;
    }

    // 5. Multi-token Match (e.g. "ultra cement", "lodha thane", "tata 550d") (Score: 45)
    if (queryTokens.length > 1) {
      const allTokensMatch = queryTokens.every((token) => {
        return (
          str.includes(token) ||
          words.some((w) => w.startsWith(token) || w.endsWith(token) || w.includes(token))
        );
      });

      if (allTokensMatch) {
        isMatch = true;
        if (highestScore < 45) {
          highestScore = 45;
          matchedField = str;
        }
      }
    }
  }

  return { isMatch, score: highestScore, matchedField };
}

/**
 * Performs categorized search across all available database entities
 * 
 * @param {string} query - Raw user search input
 * @param {object} dbSource - Mock or live db object with getter methods
 * @returns {object|null} Categorized search results with total count
 */
export function searchSellerData(query, dbSource) {
  const cleanQuery = normalizeSearchTerm(query);
  if (!cleanQuery) return null;

  const allProducts = dbSource?.getProducts ? dbSource.getProducts() : [];
  const allOrders = dbSource?.getOrders ? dbSource.getOrders() : [];
  const allCustomers = dbSource?.getCustomers ? dbSource.getCustomers() : [];
  const allQuotations = dbSource?.getQuotations ? dbSource.getQuotations() : [];

  // Keywords that map directly to category contexts
  const isOrderKeyword = ['ord', 'order', 'orders', 'purchase'].includes(cleanQuery);
  const isInvoiceKeyword = ['inv', 'invoice', 'invoices', 'tax invoice', 'bill', 'receipt'].includes(cleanQuery);
  const isCustomerKeyword = ['cus', 'cust', 'customer', 'customers', 'buyer', 'client'].includes(cleanQuery);
  const isProductKeyword = ['prod', 'product', 'products', 'item', 'items', 'catalog', 'material'].includes(cleanQuery);
  const isQuoteKeyword = ['quot', 'quote', 'quotes', 'quotation', 'quotations', 'rfq', 'estimate'].includes(cleanQuery);

  // 1. ORDERS MATCHING
  const scoredOrders = [];
  for (const o of allOrders) {
    const fields = [
      o.orderNumber,
      o.id,
      o.buyer?.company,
      o.buyer?.name,
      o.buyer?.phone,
      o.buyer?.email,
      o.buyer?.gstin,
      o.orderStatus,
      o.deliveryAddress?.siteName,
      o.deliveryAddress?.city,
      ...(o.items || []).map((it) => it.name),
      ...(o.items || []).map((it) => it.sku),
    ];

    let { isMatch, score } = evaluateSearchMatch(fields, cleanQuery);
    if (!isMatch && isOrderKeyword) {
      isMatch = true;
      score = 30;
    }

    if (isMatch) {
      scoredOrders.push({ order: o, score });
    }
  }
  scoredOrders.sort((a, b) => b.score - a.score);
  const orders = scoredOrders.slice(0, 5).map((s) => s.order);

  // 2. INVOICES MATCHING
  const scoredInvoices = [];
  for (const o of allOrders) {
    const invNumber =
      o.invoice?.invoiceNumber ||
      (o.invoiceNumber ? o.invoiceNumber : `INV-2026-${String(o.id || '').replace(/\D/g, '').padStart(5, '0') || '09081'}`);

    const fields = [
      invNumber,
      o.orderNumber,
      o.buyer?.company,
      o.buyer?.name,
      o.buyer?.gstin,
    ];

    let { isMatch, score } = evaluateSearchMatch(fields, cleanQuery);
    if (!isMatch && isInvoiceKeyword && (o.invoice || o.invoiceNumber)) {
      isMatch = true;
      score = 30;
    }

    if (isMatch) {
      scoredInvoices.push({
        invoice: {
          invoiceNumber: invNumber,
          orderId: o.id,
          orderNumber: o.orderNumber,
          buyerCompany: o.buyer?.company || o.buyer?.name || 'Contractor',
          amount: o.invoice?.totalAmount || o.invoice?.grandTotal || o.totalAmount,
          date: o.invoice?.invoiceDate || o.createdAt,
          status: o.invoice?.status || 'Generated',
        },
        score,
      });
    }
  }
  scoredInvoices.sort((a, b) => b.score - a.score);
  const invoices = scoredInvoices.slice(0, 4).map((s) => s.invoice);

  // 3. CUSTOMERS MATCHING
  const scoredCustomers = [];
  for (const c of allCustomers) {
    const fields = [
      c.company || c.companyName,
      c.name,
      c.id,
      c.city,
      c.state,
      c.phone || c.mobile,
      c.email,
      c.gstin,
    ];

    let { isMatch, score } = evaluateSearchMatch(fields, cleanQuery);
    if (!isMatch && isCustomerKeyword) {
      isMatch = true;
      score = 30;
    }

    if (isMatch) {
      scoredCustomers.push({ customer: c, score });
    }
  }
  scoredCustomers.sort((a, b) => b.score - a.score);
  const customers = scoredCustomers.slice(0, 4).map((s) => s.customer);

  // 4. PRODUCTS MATCHING
  const scoredProducts = [];
  for (const p of allProducts) {
    const fields = [
      p.name,
      p.sku,
      p.id,
      p.brand,
      p.category,
      p.subcategory,
      p.hsnCode,
      p.shortDescription,
    ];

    let { isMatch, score } = evaluateSearchMatch(fields, cleanQuery);
    if (!isMatch && isProductKeyword) {
      isMatch = true;
      score = 30;
    }

    if (isMatch) {
      scoredProducts.push({ product: p, score });
    }
  }
  scoredProducts.sort((a, b) => b.score - a.score);
  const products = scoredProducts.slice(0, 5).map((s) => s.product);

  // 5. QUOTATIONS MATCHING
  const scoredQuotations = [];
  for (const qt of allQuotations) {
    const fields = [
      qt.quotationNumber,
      qt.id,
      qt.buyer?.company,
      qt.buyer?.name,
      qt.status,
    ];

    let { isMatch, score } = evaluateSearchMatch(fields, cleanQuery);
    if (!isMatch && isQuoteKeyword) {
      isMatch = true;
      score = 30;
    }

    if (isMatch) {
      scoredQuotations.push({ quotation: qt, score });
    }
  }
  scoredQuotations.sort((a, b) => b.score - a.score);
  const quotations = scoredQuotations.slice(0, 3).map((s) => s.quotation);

  const totalCount =
    orders.length +
    invoices.length +
    customers.length +
    products.length +
    quotations.length;

  return {
    orders,
    invoices,
    customers,
    products,
    quotations,
    totalCount,
    query: cleanQuery,
  };
}

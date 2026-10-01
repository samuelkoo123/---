// CFS MySQL API Service
// 호스팅어 MySQL 및 개발 환경 REST API와 통신하는 통합 서비스

export interface Church {
  id?: string;
  name: string;
  password?: string;
  createdAt: any;
}

export interface Member {
  id?: string;
  name: string;
  phone: string;
  address: string;
  birthDate: string;
  registrationDate: string;
  createdAt?: any;
}

export interface Offering {
  id?: string;
  churchId?: string;
  memberId: string;
  type: string;
  amount: number;
  date: string;
  notes: string;
  memberName?: string;
  createdAt?: any;
}

export interface Transaction {
  id?: string;
  churchId?: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  memberId?: string;
  memberName?: string;
  createdAt?: any;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options?.headers || {})
    },
    ...options
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`서버 응답 오류 (${res.status}): ${text.slice(0, 100)}`);
    }
    throw new Error(`JSON 응답이 아닙니다: ${text.slice(0, 100)}`);
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `요청 실패 (${res.status})`);
  }

  return data as T;
}

// ==========================================
// 1. Church Operations
// ==========================================

export const getAllChurches = async (): Promise<Church[]> => {
  try {
    return await request<Church[]>('/api/churches');
  } catch (error) {
    console.error('getAllChurches error:', error);
    return [];
  }
};

export const getChurchByName = async (name: string): Promise<Church | null> => {
  try {
    const list = await getAllChurches();
    return list.find(c => c.name === name) || null;
  } catch (error) {
    console.error('getChurchByName error:', error);
    return null;
  }
};

export const addChurch = async (name: string, passwordRaw: string): Promise<string> => {
  const res = await request<{ id: string }>('/api/churches', {
    method: 'POST',
    body: JSON.stringify({ name, password: passwordRaw })
  });
  return res.id;
};

export const updateChurch = async (churchId: string, data: { name?: string; password?: string }): Promise<void> => {
  await request(`/api/churches/${churchId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteChurch = async (churchId: string): Promise<void> => {
  await request(`/api/churches/${churchId}`, {
    method: 'DELETE'
  });
};

export const loginChurch = async (name: string, passwordRaw: string): Promise<Church | null> => {
  try {
    return await request<Church>('/api/churches/login', {
      method: 'POST',
      body: JSON.stringify({ name, password: passwordRaw })
    });
  } catch (error: any) {
    console.warn('loginChurch failed:', error.message);
    return null;
  }
};

// ==========================================
// 2. Member Operations
// ==========================================

export const getMembers = async (churchId: string): Promise<Member[]> => {
  try {
    return await request<Member[]>(`/api/members?churchId=${encodeURIComponent(churchId)}`);
  } catch (error) {
    console.error('getMembers error:', error);
    return [];
  }
};

export const addMember = async (churchId: string, member: Omit<Member, 'id'>): Promise<string> => {
  const res = await request<{ id: string }>('/api/members', {
    method: 'POST',
    body: JSON.stringify({ churchId, ...member })
  });
  return res.id;
};

export const updateMember = async (churchId: string, memberId: string, member: Partial<Member>): Promise<void> => {
  await request(`/api/members/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify({ churchId, ...member })
  });
};

export const deleteMember = async (churchId: string, memberId: string): Promise<void> => {
  await request(`/api/members/${memberId}`, {
    method: 'DELETE'
  });
};

// ==========================================
// 3. Offering Operations
// ==========================================

export const getOfferings = async (churchId: string): Promise<Offering[]> => {
  try {
    return await request<Offering[]>(`/api/offerings?churchId=${encodeURIComponent(churchId)}`);
  } catch (error) {
    console.error('getOfferings error:', error);
    return [];
  }
};

export const addOffering = async (churchId: string, offering: Omit<Offering, 'id'>): Promise<string> => {
  const res = await request<{ id: string }>('/api/offerings', {
    method: 'POST',
    body: JSON.stringify({ churchId, ...offering })
  });
  return res.id;
};

export const updateOffering = async (churchId: string, offeringId: string, offering: Partial<Offering>): Promise<void> => {
  await request(`/api/offerings/${offeringId}`, {
    method: 'PUT',
    body: JSON.stringify({ churchId, ...offering })
  });
};

export const deleteOffering = async (churchId: string, offeringId: string): Promise<void> => {
  await request(`/api/offerings/${offeringId}`, {
    method: 'DELETE'
  });
};

// ==========================================
// 4. Transaction Operations
// ==========================================

export const getTransactions = async (churchId: string): Promise<Transaction[]> => {
  try {
    return await request<Transaction[]>(`/api/transactions?churchId=${encodeURIComponent(churchId)}`);
  } catch (error) {
    console.error('getTransactions error:', error);
    return [];
  }
};

export const addTransaction = async (churchId: string, transaction: Omit<Transaction, 'id'>): Promise<string> => {
  const res = await request<{ id: string }>('/api/transactions', {
    method: 'POST',
    body: JSON.stringify({ churchId, ...transaction })
  });
  return res.id;
};

export const updateTransaction = async (churchId: string, transactionId: string, transaction: Partial<Transaction>): Promise<void> => {
  await request(`/api/transactions/${transactionId}`, {
    method: 'PUT',
    body: JSON.stringify({ churchId, ...transaction })
  });
};

export const deleteTransaction = async (churchId: string, transactionId: string): Promise<void> => {
  await request(`/api/transactions/${transactionId}`, {
    method: 'DELETE'
  });
};

// ==========================================
// 5. Dashboard Stats
// ==========================================

export const getStats = async (churchId: string) => {
  const offerings = await getOfferings(churchId);
  const transactions = await getTransactions(churchId);
  const members = await getMembers(churchId);

  const totalOfferings = offerings.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return {
    totalIncome: totalOfferings + totalIncome,
    totalExpense,
    memberCount: members.length
  };
};

// ==========================================
// 6. Reports & Cash Book
// ==========================================

export const getSummaryReport = async (churchId: string, start: string, end: string) => {
  const offerings = await getOfferings(churchId);
  const transactions = await getTransactions(churchId);

  const filteredOfferings = offerings.filter(o => o.date >= start && o.date <= end);
  const filteredTransactions = transactions.filter(t => t.date >= start && t.date <= end);

  const offeringSummary = filteredOfferings.reduce((acc: any, o) => {
    acc[o.type] = (acc[o.type] || 0) + (Number(o.amount) || 0);
    return acc;
  }, {});

  const otherIncomeSummary = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + (Number(t.amount) || 0);
      return acc;
    }, {});

  const expenseSummary = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + (Number(t.amount) || 0);
      return acc;
    }, {});

  const combinedIncomes = Object.entries(offeringSummary).map(([category, total]) => ({ category, total: total as number }));
  Object.entries(otherIncomeSummary).forEach(([category, total]) => {
    const existing = combinedIncomes.find(i => i.category === category);
    if (existing) {
      existing.total += total as number;
    } else {
      combinedIncomes.push({ category, total: total as number });
    }
  });

  const expenses = Object.entries(expenseSummary).map(([category, total]) => ({ category, total: total as number }));

  return { offerings: [], otherIncomes: combinedIncomes, expenses };
};

export const getDonationReceipt = async (churchId: string, memberId: string, year: string) => {
  const offerings = await getOfferings(churchId);
  const transactions = await getTransactions(churchId);
  const members = await getMembers(churchId);

  const member = members.find(m => m.id === memberId);
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const filteredOfferings = offerings.filter(o => o.memberId === memberId && o.date >= start && o.date <= end);
  const filteredTransactions = transactions.filter(t => t.memberId === memberId && t.type === 'income' && t.date >= start && t.date <= end);

  const mergedOfferings: any[] = [];

  filteredOfferings.forEach(o => {
    const amount = Number(o.amount) || 0;
    const existing = mergedOfferings.find(m => m.type === o.type);
    if (existing) {
      existing.total += amount;
    } else {
      mergedOfferings.push({ type: o.type, total: amount });
    }
  });

  filteredTransactions.forEach(t => {
    const amount = Number(t.amount) || 0;
    const existing = mergedOfferings.find(m => m.type === t.category);
    if (existing) {
      existing.total += amount;
    } else {
      mergedOfferings.push({ type: t.category, total: amount });
    }
  });

  return { member, offerings: mergedOfferings, year };
};

export const getCashBookData = async (churchId: string, start: string, end: string) => {
  const offerings = await getOfferings(churchId);
  const transactions = await getTransactions(churchId);

  // Calculate initial balance (all income - all expenses before start date)
  const priorOfferings = offerings.filter(o => o.date < start);
  const priorTransactions = transactions.filter(t => t.date < start);
  
  const initialIncome = priorOfferings.reduce((sum, o) => sum + (Number(o.amount) || 0), 0) + 
                        priorTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const initialExpense = priorTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  
  const initialBalance = initialIncome - initialExpense;

  // Get entries within range
  const currentOfferings = offerings.filter(o => o.date >= start && o.date <= end).map(o => ({
    date: o.date,
    createdAt: typeof o.createdAt === 'number' ? o.createdAt : (o.createdAt ? new Date(o.createdAt).getTime() : 0),
    description: `${o.memberName || '미지정'} (${o.type})`,
    income: Number(o.amount) || 0,
    expense: 0,
    remarks: o.notes || ""
  }));

  const currentTransactions = transactions.filter(t => t.date >= start && t.date <= end).map(t => ({
    date: t.date,
    createdAt: typeof t.createdAt === 'number' ? t.createdAt : (t.createdAt ? new Date(t.createdAt).getTime() : 0),
    description: t.description || t.category,
    income: t.type === 'income' ? (Number(t.amount) || 0) : 0,
    expense: t.type === 'expense' ? (Number(t.amount) || 0) : 0,
    remarks: t.memberName ? `교인: ${t.memberName}` : ""
  }));

  const entries = [...currentOfferings, ...currentTransactions].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  return { initialBalance, entries };
};

// ==========================================
// 7. Bulk Data Restore
// ==========================================

export const restoreData = async (churchId: string, type: 'members' | 'offerings' | 'transactions', data: any[]) => {
  return await request('/api/restore', {
    method: 'POST',
    body: JSON.stringify({ churchId, type, data })
  });
};

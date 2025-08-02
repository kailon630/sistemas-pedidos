import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  FileText,
  Package,
  Users,
  Settings,
  BarChart3,
  Shield,
  Building,
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

interface SearchItem {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  category: 'navigation' | 'recent' | 'quick-actions';
  adminOnly?: boolean;
  keywords: string[];
}

// Extrai os itens estáticos para não recriar a cada render
const ALL_ITEMS: SearchItem[] = [
  { id: 'dashboard', title: 'Dashboard', description: 'Visão geral do sistema', url: '/', icon: BarChart3, category: 'navigation', keywords: ['dashboard','home','principal','inicio','visao geral'] },
  { id: 'new-request', title: 'Nova Requisição', description: 'Criar uma nova requisição de compra', url: '/requests/new', icon: FileText, category: 'quick-actions', keywords: ['nova','requisicao','criar','pedido','compra','solicitar'] },
  { id: 'my-requests', title: 'Minhas Requisições', description: 'Ver todas as minhas requisições', url: '/requests', icon: FileText, category: 'navigation', keywords: ['requisicoes','pedidos','minhas','lista','historico'] },
  { id: 'products', title: 'Produtos', description: 'Gerenciar catálogo de produtos', url: '/products', icon: Package, category: 'navigation', keywords: ['produtos','catalogo','items','mercadorias'] },
  { id: 'new-product', title: 'Cadastrar Produto', description: 'Adicionar novo produto ao catálogo', url: '/products/new', icon: Package, category: 'quick-actions', keywords: ['produto','cadastrar','novo','adicionar','criar'] },
  { id: 'product-requests', title: 'Solicitações de Produto', description: 'Gerenciar solicitações de cadastro', url: '/product-requests', icon: Package, category: 'navigation', keywords: ['solicitacoes','produto','cadastro','aprovacao'] },
  { id: 'suppliers', title: 'Fornecedores', description: 'Gerenciar fornecedores', url: '/suppliers', icon: Building, category: 'navigation', keywords: ['fornecedores','suppliers','empresas','vendedores'] },
  { id: 'budgets', title: 'Cotações', description: 'Gerenciar cotações de preços', url: '/budgets', icon: FileText, category: 'navigation', keywords: ['cotacoes','orcamentos','precos','budgets'] },
  { id: 'settings', title: 'Configurações', description: 'Configurações do sistema e perfil', url: '/settings', icon: Settings, category: 'navigation', keywords: ['configuracoes','settings','perfil','conta'] },
  { id: 'profile', title: 'Meu Perfil', description: 'Editar informações do perfil', url: '/profile', icon: Users, category: 'navigation', keywords: ['perfil','profile','usuario','conta','dados'] },
  // Admin
  { id: 'admin-panel', title: 'Painel Administrativo', description: 'Gerenciar requisições como administrador', url: '/admin/requests', icon: Shield, category: 'navigation', adminOnly: true, keywords: ['admin','administrativo','painel','gerenciar','aprovar'] },
  { id: 'sectors', title: 'Setores', description: 'Gerenciar setores da empresa', url: '/sectors', icon: Building, category: 'navigation', adminOnly: true, keywords: ['setores','departamentos','organizacao'] },
  { id: 'requesters', title: 'Solicitantes', description: 'Gerenciar usuários do sistema', url: '/requesters', icon: Users, category: 'navigation', adminOnly: true, keywords: ['solicitantes','usuarios','pessoas','funcionarios'] },
  { id: 'reports', title: 'Relatórios', description: 'Visualizar relatórios do sistema', url: '/reports', icon: BarChart3, category: 'navigation', adminOnly: true, keywords: ['relatorios','reports','dados','estatisticas','graficos'] },
  { id: 'priorities', title: 'Prioridades', description: 'Gerenciar prioridades das requisições', url: '/admin/priorities', icon: Shield, category: 'navigation', adminOnly: true, keywords: ['prioridades','urgente','importante','classificacao'] },
];

const SearchBox: React.FC = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentItems, setRecentItems] = useState<SearchItem[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtra e exibe "recent" quando query vazia
  const filteredItems = useMemo(() => {
    const source = query.trim()
      ? ALL_ITEMS
      : [...recentItems]; // se vazio, mostra recentes

    return source.filter(item => {
      if (item.adminOnly && !isAdmin) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some(k => k.includes(q))
      );
    });
  }, [query, isAdmin, recentItems]);

  // Agrupa por categoria
  const groupedItems = useMemo(() => {
    return filteredItems.reduce<Record<string, SearchItem[]>>((acc, item) => {
      acc[item.category] = acc[item.category] || [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [filteredItems]);

  // Click fora fecha
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Teclado
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % filteredItems.length);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filteredItems.length) % filteredItems.length);
      }
      if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleItemClick(filteredItems[selectedIndex]);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, selectedIndex, filteredItems]);

  const handleItemClick = (item: SearchItem) => {
    navigate(item.url);
    // atualiza recentItems, mantendo último em cima, max 5
    setRecentItems(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      return [item, ...filtered].slice(0, 5);
    });
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(!!e.target.value.trim() || recentItems.length > 0);
    setSelectedIndex(-1);
  };

  const categoryLabel = (cat: string) =>
    cat === 'quick-actions' ? 'Ações Rápidas'
      : cat === 'navigation' ? 'Páginas'
      : cat === 'recent' ? 'Recentes'
      : 'Resultados';

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <Search 
          size={20}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar páginas, ações..."
          value={query}
          onChange={onChange}
          onFocus={() => setIsOpen(true)}
          className="
            w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md 
            focus:outline-none focus:border-[#679080] focus:ring-2 focus:ring-[#679080]/10
            transition
          "
        />
      </div>

      {isOpen && (
        <div className="
          absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 
          rounded-md shadow-lg z-50 max-h-96 overflow-y-auto
        ">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search size={32} className="mx-auto mb-2 text-gray-300" />
              <p>Nenhum resultado encontrado</p>
              <p className="text-xs mt-1">
                Tente pesquisar por "requisição", "produto" ou "dashboard"
              </p>
            </div>
          ) : (
            Object.entries(groupedItems).map(([cat, items]) => (
              <div key={cat}>
                <div className="
                  px-4 py-2 text-xs font-semibold text-gray-500 uppercase
                  tracking-wider border-b border-gray-100
                ">
                  {categoryLabel(cat)}
                </div>
                {items.map((item) => {
                  const globalIndex = filteredItems.indexOf(item);
                  const Icon = item.icon;
                  const isSelected = selectedIndex === globalIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`
                        w-full px-4 py-3 text-left flex items-center space-x-3 
                        hover:bg-gray-50 transition-colors
                        ${isSelected ? 'bg-[#679080]/10' : ''}
                      `}
                    >
                      <div className="
                        w-8 h-8 rounded-md flex items-center justify-center
                        bg-[#679080]/10
                      ">
                        <Icon size={16} className="text-[#679080]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {item.description}
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-gray-300" />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBox;

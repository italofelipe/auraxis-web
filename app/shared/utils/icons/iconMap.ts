import {
  LayoutDashboard, Wallet, Target, Wrench,
  ArrowRightLeft, BarChart3, Settings, LogOut,
  User, Bell, Plus, Minus, Search, X,
  ChevronRight, ChevronDown, TrendingUp, TrendingDown,
  Eye, EyeOff, Check, AlertTriangle, Info,
  Upload, Download, Filter, Calendar, CalendarCheck,
  Menu, PieChart, ChartLine,
} from "lucide-vue-next";
import type { IconMap } from "./icons.types";

/**
 * Mapa canônico de ícones do Auraxis.
 * SEMPRE use este mapa — nunca importar ícones Lucide diretamente nas features.
 * Para adicionar um ícone: adicionar aqui + em AuraxisIconName.
 */
export const ICON_MAP: IconMap = {
  dashboard:     LayoutDashboard,
  wallet:        Wallet,
  goals:         Target,
  tools:         Wrench,
  transactions:  ArrowRightLeft,
  analytics:     BarChart3,
  settings:      Settings,
  logout:        LogOut,
  user:          User,
  notifications: Bell,
  plus:          Plus,
  minus:         Minus,
  search:        Search,
  close:         X,
  chevronRight:  ChevronRight,
  chevronDown:   ChevronDown,
  trendingUp:    TrendingUp,
  trendingDown:  TrendingDown,
  eye:           Eye,
  eyeOff:        EyeOff,
  check:         Check,
  warning:       AlertTriangle,
  info:          Info,
  upload:        Upload,
  download:      Download,
  filter:        Filter,
  calendar:      Calendar,
  calendarCheck: CalendarCheck,
  menu:          Menu,
  pieChart:      PieChart,
  chartLine:     ChartLine,
  target:        Target,
};

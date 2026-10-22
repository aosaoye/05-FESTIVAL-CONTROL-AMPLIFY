import { useMemo, useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Modal,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  LayoutDashboard,
  Calendar,
  Plus,
  Menu,
  X,
  Search,
  Moon,
  Sun,
  Clock,
  MapPin,
  Check,
  Trash2,
  Edit3,
  RefreshCw,
  User,
  SlidersHorizontal,
  ArrowUpRight,
  Bell,
  Mail,
  HelpCircle,
  Settings,
  Folder,
  CheckSquare,
  Users,
  Database,
  Radio,
  Music,
} from 'lucide-react-native';
import { initialEvents, FestivalEvent, EventStatus } from './src/data';
import { festivalApi } from './src/services/api';

type Page = 'dashboard' | 'events' | 'form';
const stages = ['MAIN STAGE', 'GARDEN', 'WAREHOUSE', 'RIVER STAGE'] as const;
const statuses: EventStatus[] = ['CONFIRMED', 'DELAYED', 'CANCELLED'];

export default function App() {
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const medium = width >= 768;

  // Navigation & Theme
  const [page, setPage] = useState<Page>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Data State
  const [events, setEvents] = useState<FestivalEvent[]>(initialEvents);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('TODOS');
  const [dateFilter, setDateFilter] = useState<'HOY' | 'MANANA'>('HOY');
  const [editingId, setEditingId] = useState<string | null>(null);

  // API & Persistence State
  const [backendSource, setBackendSource] = useState<'dynamodb' | 'local'>('local');
  const [isLoading, setIsLoading] = useState(false);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(festivalApi.getApiUrl());

  // Form Fields
  const [formArtist, setFormArtist] = useState('');
  const [formSpace, setFormSpace] = useState<string>(stages[0]);
  const [formTime, setFormTime] = useState('22:00');
  const [formStatus, setFormStatus] = useState<EventStatus>('CONFIRMED');
  const [feedback, setFeedback] = useState('');

  // Load events
  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const res = await festivalApi.getEvents();
      setEvents(res.events);
      setBackendSource(res.source);
    } catch {
      setBackendSource('local');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Metrics
  const total = events.length;
  const confirmed = useMemo(() => events.filter(e => e.status === 'CONFIRMED').length, [events]);
  const delayed = useMemo(() => events.filter(e => e.status === 'DELAYED').length, [events]);
  const cancelled = useMemo(() => events.filter(e => e.status === 'CANCELLED').length, [events]);

  const confirmedPct = total > 0 ? Math.round((confirmed / total) * 100) : 0;
  const delayedPct = total > 0 ? Math.round((delayed / total) * 100) : 0;
  const cancelledPct = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchStage = stageFilter === 'TODOS' || e.space === stageFilter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        e.artist.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.space.toLowerCase().includes(q);
      return matchStage && matchSearch;
    });
  }, [events, search, stageFilter]);

  // Handlers
  const openNew = () => {
    setEditingId(null);
    setFormArtist('');
    setFormSpace(stages[0]);
    setFormTime('22:00');
    setFormStatus('CONFIRMED');
    setFeedback('');
    setPage('form');
    setDrawerOpen(false);
  };

  const openEdit = (e: FestivalEvent) => {
    setEditingId(e.id);
    setFormArtist(e.artist);
    setFormSpace(e.space);
    setFormTime(e.time);
    setFormStatus(e.status);
    setFeedback('');
    setPage('form');
    setDrawerOpen(false);
  };

  const handleSave = async () => {
    if (!formArtist.trim() || !/^([01]\d|2[0-3]):[0-5]\d$/.test(formTime)) {
      setFeedback('Introduce el nombre del artista y una hora válida (HH:MM).');
      return;
    }

    setIsLoading(true);
    try {
      if (editingId) {
        const res = await festivalApi.updateEvent(editingId, {
          artist: formArtist.trim().toUpperCase(),
          space: formSpace,
          time: formTime,
          status: formStatus,
        });
        setEvents(prev => prev.map(e => (e.id === editingId ? res.event : e)));
        setFeedback(`Actuación "${res.event.artist}" actualizada (${res.source === 'dynamodb' ? 'DynamoDB' : 'Local'}).`);
      } else {
        const res = await festivalApi.createEvent({
          artist: formArtist.trim().toUpperCase(),
          space: formSpace,
          time: formTime,
          status: formStatus,
        });
        setEvents(prev => [res.event, ...prev]);
        setFeedback(`"${res.event.artist}" añadida al cartel (${res.source === 'dynamodb' ? 'DynamoDB' : 'Local'}).`);
      }
    } finally {
      setIsLoading(false);
      setPage('events');
    }
  };

  const handleCycleStatus = async (id: string) => {
    const current = events.find(e => e.id === id);
    if (!current) return;

    const next: EventStatus =
      current.status === 'CONFIRMED'
        ? 'DELAYED'
        : current.status === 'DELAYED'
        ? 'CANCELLED'
        : 'CONFIRMED';

    setEvents(prev => prev.map(e => (e.id === id ? { ...e, status: next } : e)));
    try {
      await festivalApi.updateEvent(id, { status: next });
    } catch (err) {
      console.warn('Error al actualizar estado:', err);
    }
  };

  const handleDelete = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setFeedback('Actuación eliminada del cartel.');
    try {
      await festivalApi.deleteEvent(id);
    } catch (err) {
      console.warn('Error al eliminar:', err);
    }
  };

  const handleConnectApi = async () => {
    festivalApi.setApiUrl(apiUrlInput);
    setApiModalOpen(false);
    await loadEvents();
  };

  // Stage card colors (soft pastel tinted square badges like Panze tasks)
  const getStageMeta = (space: string) => {
    switch (space) {
      case 'MAIN STAGE':
        return { bg: '#FFEDD5', color: '#EA580C', icon: '⚡' };
      case 'GARDEN':
        return { bg: '#DCFCE7', color: '#16A34A', icon: '🌿' };
      case 'WAREHOUSE':
        return { bg: '#F3E8FF', color: '#9333EA', icon: '🏛️' };
      case 'RIVER STAGE':
      default:
        return { bg: '#E0F2FE', color: '#0284C7', icon: '🌊' };
    }
  };

  // Colors based on Light/Dark
  const c = {
    canvasBg: isDark ? '#090D14' : '#E8EEF5',
    cardBg: isDark ? '#121722' : '#FFFFFF',
    innerCard: isDark ? '#192030' : '#F8FAFC',
    border: isDark ? '#232C3F' : '#EEF2F6',
    borderSubtle: isDark ? '#1D2536' : '#F1F5F9',
    text: isDark ? '#F8FAFC' : '#0F172A',
    textMuted: isDark ? '#94A3B8' : '#64748B',
    textSub: isDark ? '#64748B' : '#94A3B8',
    pillActive: isDark ? '#FFFFFF' : '#0F172A',
    pillActiveText: isDark ? '#0F172A' : '#FFFFFF',
    railActive: isDark ? '#1E2738' : '#0F172A',
    railActiveIcon: isDark ? '#38BDF8' : '#FFFFFF',
    railIcon: isDark ? '#64748B' : '#94A3B8',
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.canvasBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Floating Outer Shell (Panze Studio Aesthetic) */}
      <View style={[styles.outerShell, { backgroundColor: c.cardBg, borderColor: c.border }]}>
        {/* ===================== TOP GLOBAL HEADER ===================== */}
        <View style={[styles.topHeader, { borderBottomColor: c.borderSubtle }]}>
          {/* Brand */}
          <View style={styles.brandRow}>
            {!wide && (
              <Pressable
                onPress={() => setDrawerOpen(true)}
                style={[styles.mobileMenuBtn, { backgroundColor: c.innerCard, borderColor: c.border }]}
              >
                <Menu size={18} color={c.text} />
              </Pressable>
            )}

            <View style={styles.logoGroup}>
              <Text style={[styles.logoBold, { color: c.text }]}>fest</Text>
              <Text style={[styles.logoSub, { color: c.textMuted }]}>ops.</Text>
            </View>
          </View>

          {/* Center: Stage/Time Segmented Pills (Desktop) */}
          {medium && (
            <View style={[styles.segmentedContainer, { backgroundColor: c.innerCard, borderColor: c.border }]}>
              {['TODOS', 'MAIN STAGE', 'GARDEN', 'WAREHOUSE'].map(st => {
                const active = stageFilter === st;
                return (
                  <Pressable
                    key={st}
                    onPress={() => {
                      setStageFilter(st);
                      if (page === 'form') setPage('dashboard');
                    }}
                    style={[
                      styles.segmentPill,
                      active && [styles.segmentPillActive, { backgroundColor: c.pillActive }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentPillText,
                        { color: active ? c.pillActiveText : c.textMuted },
                        active && { fontWeight: '700' },
                      ]}
                    >
                      {st}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Right Utilities + User Profile */}
          <View style={styles.utilitiesRow}>
            {/* Backend DynamoDB Chip */}
            <Pressable
              onPress={() => setApiModalOpen(true)}
              style={[
                styles.headerActionCircle,
                {
                  backgroundColor: backendSource === 'dynamodb' ? '#DCFCE7' : c.innerCard,
                  borderColor: backendSource === 'dynamodb' ? '#86EFAC' : c.border,
                },
              ]}
              accessibilityLabel="Configuración DynamoDB"
            >
              <Database size={15} color={backendSource === 'dynamodb' ? '#16A34A' : c.textMuted} />
            </Pressable>

            {/* Theme Switcher Button */}
            <Pressable
              onPress={() => setIsDark(!isDark)}
              style={[styles.headerActionCircle, { backgroundColor: c.innerCard, borderColor: c.border }]}
              accessibilityLabel="Cambiar tema"
            >
              {isDark ? <Sun size={15} color={c.text} /> : <Moon size={15} color={c.text} />}
            </Pressable>

            {/* Notification Bell with unread dot */}
            <View style={[styles.headerActionCircle, { backgroundColor: c.innerCard, borderColor: c.border }]}>
              <Bell size={15} color={c.textMuted} />
              <View style={styles.unreadDot} />
            </View>

            {/* Operator Profile Chip */}
            {wide && (
              <View style={styles.userProfileChip}>
                <View style={styles.userAvatar}>
                  <Text style={styles.avatarText}>OP</Text>
                </View>
                <View>
                  <Text style={[styles.userName, { color: c.text }]}>Operador ZGZ</Text>
                  <Text style={[styles.userRole, { color: c.textSub }]}>Live Director</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ===================== BODY: RAIL + WORKSPACE ===================== */}
        <View style={styles.bodyLayout}>
          {/* Desktop Left Icon Rail */}
          {wide && (
            <View style={[styles.iconRail, { borderRightColor: c.borderSubtle }]}>
              <View style={styles.railTopGroup}>
                {/* Dashboard Active Pill */}
                <Pressable
                  onPress={() => setPage('dashboard')}
                  style={[
                    styles.railIconCircle,
                    page === 'dashboard' && [styles.railIconCircleActive, { backgroundColor: c.railActive }],
                  ]}
                >
                  <LayoutDashboard
                    size={19}
                    color={page === 'dashboard' ? c.railActiveIcon : c.railIcon}
                  />
                </Pressable>

                {/* Events Link */}
                <Pressable
                  onPress={() => setPage('events')}
                  style={[
                    styles.railIconCircle,
                    page === 'events' && [styles.railIconCircleActive, { backgroundColor: c.railActive }],
                  ]}
                >
                  <Calendar size={19} color={page === 'events' ? c.railActiveIcon : c.railIcon} />
                </Pressable>

                {/* Add Event Link */}
                <Pressable
                  onPress={openNew}
                  style={[
                    styles.railIconCircle,
                    page === 'form' && !editingId && [styles.railIconCircleActive, { backgroundColor: c.railActive }],
                  ]}
                >
                  <Plus size={19} color={page === 'form' ? c.railActiveIcon : c.railIcon} />
                </Pressable>

                {/* Stages shortcut */}
                <Pressable
                  onPress={() => {
                    setStageFilter('TODOS');
                    setPage('events');
                  }}
                  style={styles.railIconCircle}
                >
                  <Music size={19} color={c.railIcon} />
                </Pressable>

                <Pressable onPress={() => setApiModalOpen(true)} style={styles.railIconCircle}>
                  <Database size={19} color={c.railIcon} />
                </Pressable>
              </View>

              <View style={styles.railBottomGroup}>
                <Pressable onPress={() => setIsDark(!isDark)} style={styles.railIconCircle}>
                  {isDark ? <Sun size={18} color={c.railIcon} /> : <Moon size={18} color={c.railIcon} />}
                </Pressable>
              </View>
            </View>
          )}

          {/* ===================== MAIN SCROLL AREA ===================== */}
          <ScrollView
            style={styles.workspaceScroll}
            contentContainerStyle={styles.workspaceContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Page Header Section: Title & Search Pill */}
            <View style={styles.subHeaderRow}>
              <View>
                <Text style={[styles.subHeaderKicker, { color: c.textMuted }]}>
                  Manage and track festival operations
                </Text>
                <Text style={[styles.subHeaderTitle, { color: c.text }]}>
                  {page === 'dashboard'
                    ? 'Festival Dashboard'
                    : page === 'events'
                    ? 'Programación'
                    : editingId
                    ? 'Editar Actuación'
                    : 'Nueva Actuación'}
                </Text>
              </View>

              {/* Large Search Pill (Panze Studio Style) */}
              <View style={[styles.searchPill, { backgroundColor: c.innerCard, borderColor: c.border }]}>
                <Search size={16} color={c.textSub} />
                <TextInput
                  placeholder="Buscar artista, escenario, ID..."
                  placeholderTextColor={c.textSub}
                  style={[styles.searchPillInput, { color: c.text }]}
                  value={search}
                  onChangeText={setSearch}
                />
                {!!search && (
                  <Pressable onPress={() => setSearch('')}>
                    <X size={14} color={c.textSub} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Notification alert banner */}
            {!!feedback && (
              <View style={[styles.feedbackChip, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
                <Check size={14} color="#16A34A" />
                <Text style={styles.feedbackChipText}>{feedback}</Text>
              </View>
            )}

            {/* ===================== VIEW: DASHBOARD (3 COLUMNS) ===================== */}
            {page === 'dashboard' && (
              <View style={[styles.dashboardGrid, wide && styles.dashboardGridDesktop]}>
                {/* ---------------- COLUMN 1: "My Tasks" style -> Actuaciones ---------------- */}
                <View style={[styles.columnCard, { backgroundColor: c.cardBg, borderColor: c.border }]}>
                  {/* Card Header */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardHeading, { color: c.text }]}>Actuaciones</Text>
                    <Pressable
                      onPress={openNew}
                      style={[styles.plusCircleBtn, { backgroundColor: c.innerCard, borderColor: c.border }]}
                    >
                      <Plus size={16} color={c.text} />
                    </Pressable>
                  </View>

                  {/* Filter Pills: Hoy / Mañana */}
                  <View style={styles.tasksFilterRow}>
                    <Pressable
                      onPress={() => setDateFilter('HOY')}
                      style={[
                        styles.taskFilterPill,
                        dateFilter === 'HOY' && [styles.taskFilterPillActive, { backgroundColor: c.pillActive }],
                      ]}
                    >
                      <Text
                        style={[
                          styles.taskFilterPillText,
                          { color: dateFilter === 'HOY' ? c.pillActiveText : c.textMuted },
                        ]}
                      >
                        Hoy
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setDateFilter('MANANA')}
                      style={[
                        styles.taskFilterPill,
                        dateFilter === 'MANANA' && [styles.taskFilterPillActive, { backgroundColor: c.pillActive }],
                      ]}
                    >
                      <Text
                        style={[
                          styles.taskFilterPillText,
                          { color: dateFilter === 'MANANA' ? c.pillActiveText : c.textMuted },
                        ]}
                      >
                        Mañana
                      </Text>
                    </Pressable>
                  </View>

                  {/* On Going summary badge */}
                  <View style={[styles.ongoingBadge, { backgroundColor: c.innerCard }]}>
                    <View style={styles.ongoingLeft}>
                      <View style={[styles.ongoingCountCircle, { backgroundColor: c.text }]}>
                        <Text style={[styles.ongoingCountText, { color: c.cardBg }]}>{events.length}</Text>
                      </View>
                      <Text style={[styles.ongoingText, { color: c.text }]}>En Programación</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: c.textSub }}>▾</Text>
                  </View>

                  {/* Task Style Event Cards */}
                  <View style={styles.taskCardsList}>
                    {events.slice(0, 4).map(e => {
                      const meta = getStageMeta(e.space);
                      const isConfirmed = e.status === 'CONFIRMED';
                      const isDelayed = e.status === 'DELAYED';

                      return (
                        <View
                          key={e.id}
                          style={[
                            styles.taskCard,
                            { backgroundColor: c.innerCard, borderColor: c.borderSubtle },
                          ]}
                        >
                          {/* Left: Soft pastel square badge */}
                          <View style={[styles.taskSquareBadge, { backgroundColor: meta.bg }]}>
                            <Text style={styles.taskSquareEmoji}>{meta.icon}</Text>
                          </View>

                          {/* Center info */}
                          <View style={styles.taskCardBody}>
                            <Text style={[styles.taskArtistName, { color: c.text }]} numberOfLines={1}>
                              {e.artist}
                            </Text>
                            <Text style={[styles.taskStageTime, { color: c.textSub }]} numberOfLines={1}>
                              {e.space} · {e.time}
                            </Text>
                          </View>

                          {/* Right: Circular Check Button */}
                          <Pressable
                            onPress={() => handleCycleStatus(e.id)}
                            style={[
                              styles.taskCheckCircle,
                              isConfirmed && styles.taskCheckConfirmed,
                              isDelayed && styles.taskCheckDelayed,
                            ]}
                          >
                            <Check
                              size={12}
                              color={isConfirmed ? '#16A34A' : isDelayed ? '#D97706' : '#DC2626'}
                            />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>

                  <Pressable onPress={() => setPage('events')} style={styles.viewMoreRow}>
                    <Text style={[styles.viewMoreText, { color: c.textMuted }]}>Ver todo el cartel →</Text>
                  </Pressable>
                </View>

                {/* ---------------- COLUMN 2: Projects Overview & Wave & Progress Bars ---------------- */}
                <View style={styles.centerColGroup}>
                  {/* Top: Donut Chart (Projects Overview) & Wave Chart (Income vs Expense) */}
                  <View style={[styles.middleSplitRow, medium && styles.middleSplitRowDesktop]}>
                    {/* Projects Overview: Donut Chart */}
                    <View style={[styles.columnCard, { flex: 1, backgroundColor: c.cardBg, borderColor: c.border }]}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={[styles.cardHeading, { color: c.text }]}>Resumen Estados</Text>
                        <ArrowUpRight size={16} color={c.textMuted} />
                      </View>

                      {/* Donut Chart with SVG */}
                      <View style={styles.donutCenterWrap}>
                        <Svg width={110} height={110} viewBox="0 0 100 100">
                          {/* Gray Track */}
                          <Circle cx="50" cy="50" r="38" stroke={isDark ? '#232C3F' : '#E2E8F0'} strokeWidth="11" fill="none" />
                          {/* Emerald confirmed arc */}
                          <Circle
                            cx="50"
                            cy="50"
                            r="38"
                            stroke="#0284C7"
                            strokeWidth="11"
                            strokeDasharray="238"
                            strokeDashoffset={238 - (238 * confirmedPct) / 100}
                            strokeLinecap="round"
                            fill="none"
                            rotation="-90"
                            origin="50, 50"
                          />
                          {/* Amber delayed arc */}
                          <Circle
                            cx="50"
                            cy="50"
                            r="38"
                            stroke="#F97316"
                            strokeWidth="11"
                            strokeDasharray="238"
                            strokeDashoffset={238 - (238 * delayedPct) / 100}
                            strokeLinecap="round"
                            fill="none"
                            rotation={confirmedPct * 3.6 - 90}
                            origin="50, 50"
                          />
                        </Svg>
                      </View>

                      {/* Donut Legend */}
                      <View style={styles.donutLegendRow}>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
                          <Text style={[styles.legendText, { color: c.textMuted }]}>
                            Retrasados: {delayed}
                          </Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: '#0284C7' }]} />
                          <Text style={[styles.legendText, { color: c.textMuted }]}>
                            Confirmados: {confirmed}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Wave Chart (Income vs Expense style) */}
                    <View style={[styles.columnCard, { flex: 1, backgroundColor: c.cardBg, borderColor: c.border }]}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={[styles.cardHeading, { color: c.text }]}>Horarios / Aforo</Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <SlidersHorizontal size={14} color={c.textMuted} />
                          <ArrowUpRight size={14} color={c.textMuted} />
                        </View>
                      </View>

                      {/* Legend info */}
                      <View style={styles.waveLegendInfo}>
                        <Text style={{ fontSize: 10, color: '#0284C7', fontWeight: '700' }}>
                          ● Main Stage: 22h - 02h
                        </Text>
                        <Text style={{ fontSize: 10, color: '#F97316', fontWeight: '700' }}>
                          ● Secundarios: 20h - 04h
                        </Text>
                      </View>

                      {/* Smooth SVG Wave Line Chart */}
                      <View style={styles.waveSvgWrap}>
                        <Svg width="100%" height={65} viewBox="0 0 200 65" preserveAspectRatio="none">
                          <Defs>
                            <LinearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                              <Stop offset="0%" stopColor="#0284C7" stopOpacity="0.25" />
                              <Stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
                            </LinearGradient>
                          </Defs>
                          <Path
                            d="M0,35 Q30,10 60,30 T120,20 T170,40 T200,25 L200,65 L0,65 Z"
                            fill="url(#waveGrad)"
                          />
                          <Path
                            d="M0,35 Q30,10 60,30 T120,20 T170,40 T200,25"
                            stroke="#0284C7"
                            strokeWidth="2.5"
                            fill="none"
                          />
                          <Path
                            d="M0,48 Q40,55 80,45 T140,50 T200,42"
                            stroke="#F97316"
                            strokeWidth="2"
                            strokeDasharray="4,4"
                            fill="none"
                          />
                        </Svg>
                      </View>

                      <View style={styles.waveMonthsRow}>
                        {['20h', '22h', '00h', '02h', '04h'].map(h => (
                          <Text key={h} style={[styles.waveMonthText, { color: c.textSub }]}>
                            {h}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Bottom: Progress Bars (Invoice Overview Style in Panze Studio) */}
                  <View style={[styles.columnCard, { backgroundColor: c.cardBg, borderColor: c.border }]}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={[styles.cardHeading, { color: c.text }]}>Estado General de Actuaciones</Text>
                      <SlidersHorizontal size={14} color={c.textMuted} />
                    </View>

                    {/* Progress Bar Rows */}
                    <View style={styles.progressBarsStack}>
                      {/* Confirmados */}
                      <View style={styles.barBlock}>
                        <View style={styles.barLabelGroup}>
                          <Text style={[styles.barName, { color: c.text }]}>Confirmados</Text>
                          <Text style={[styles.barStat, { color: c.textMuted }]}>
                            {confirmed} | {confirmedPct}%
                          </Text>
                        </View>
                        <View style={[styles.barTrack, { backgroundColor: c.innerCard }]}>
                          <View
                            style={[
                              styles.barFill,
                              { backgroundColor: '#8B5CF6', width: `${Math.max(confirmedPct, 8)}%` },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Retrasados */}
                      <View style={styles.barBlock}>
                        <View style={styles.barLabelGroup}>
                          <Text style={[styles.barName, { color: c.text }]}>Retrasados</Text>
                          <Text style={[styles.barStat, { color: c.textMuted }]}>
                            {delayed} | {delayedPct}%
                          </Text>
                        </View>
                        <View style={[styles.barTrack, { backgroundColor: c.innerCard }]}>
                          <View
                            style={[
                              styles.barFill,
                              { backgroundColor: '#EF4444', width: `${Math.max(delayedPct, 8)}%` },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Cancelados */}
                      <View style={styles.barBlock}>
                        <View style={styles.barLabelGroup}>
                          <Text style={[styles.barName, { color: c.text }]}>Cancelados</Text>
                          <Text style={[styles.barStat, { color: c.textMuted }]}>
                            {cancelled} | {cancelledPct}%
                          </Text>
                        </View>
                        <View style={[styles.barTrack, { backgroundColor: c.innerCard }]}>
                          <View
                            style={[
                              styles.barFill,
                              { backgroundColor: '#38BDF8', width: `${Math.max(cancelledPct, 8)}%` },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Escenarios en marcha */}
                      <View style={styles.barBlock}>
                        <View style={styles.barLabelGroup}>
                          <Text style={[styles.barName, { color: c.text }]}>Escenarios Activos</Text>
                          <Text style={[styles.barStat, { color: c.textMuted }]}>4 | 100%</Text>
                        </View>
                        <View style={[styles.barTrack, { backgroundColor: c.innerCard }]}>
                          <View style={[styles.barFill, { backgroundColor: '#10B981', width: '100%' }]} />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* ---------------- COLUMN 3: Escenarios (My Meetings) & Equipo (Open Tickets) ---------------- */}
                <View style={[styles.columnCard, { backgroundColor: c.cardBg, borderColor: c.border }]}>
                  {/* Top: Escenarios en Directo (My Meetings style) */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardHeading, { color: c.text }]}>Escenarios Activos</Text>
                    <Calendar size={15} color={c.textMuted} />
                  </View>

                  <View style={styles.meetingCardsStack}>
                    {stages.slice(0, 3).map((st, i) => {
                      const currentAct = events.find(e => e.space === st);
                      return (
                        <Pressable
                          key={st}
                          onPress={() => {
                            setStageFilter(st);
                            setPage('events');
                          }}
                          style={[styles.meetingCard, { backgroundColor: c.innerCard, borderColor: c.borderSubtle }]}
                        >
                          <View>
                            <Text style={[styles.meetingTime, { color: c.textMuted }]}>
                              {currentAct ? currentAct.time : '22:00'}
                            </Text>
                            <Text style={[styles.meetingTitle, { color: c.text }]}>{st}</Text>
                            <Text style={[styles.meetingArtist, { color: c.textSub }]}>
                              {currentAct ? currentAct.artist : 'En Preparación'}
                            </Text>
                          </View>
                          <ArrowUpRight size={14} color={c.textMuted} />
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable
                    onPress={() => {
                      setStageFilter('TODOS');
                      setPage('events');
                    }}
                    style={styles.seeAllRow}
                  >
                    <Text style={[styles.seeAllText, { color: c.textMuted }]}>Ver los 4 escenarios &gt;</Text>
                  </Pressable>

                  {/* Bottom: Equipo de Operaciones (Open Tickets style in Panze Studio) */}
                  <View style={[styles.ticketsSection, { borderTopColor: c.borderSubtle }]}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={[styles.cardHeading, { color: c.text }]}>Equipo en Vivo</Text>
                      <SlidersHorizontal size={14} color={c.textMuted} />
                    </View>

                    <View style={styles.ticketStaffList}>
                      {[
                        { name: 'Javier Navarro', role: 'Técnico Main Stage', initials: 'JN' },
                        { name: 'Sara Morales', role: 'Coordinadora Garden', initials: 'SM' },
                        { name: 'Raúl Giménez', role: 'Jefe Warehouse', initials: 'RG' },
                      ].map(staff => (
                        <View
                          key={staff.name}
                          style={[styles.staffRow, { backgroundColor: c.innerCard, borderColor: c.borderSubtle }]}
                        >
                          <View style={styles.staffAvatarCircle}>
                            <Text style={styles.staffAvatarText}>{staff.initials}</Text>
                          </View>
                          <View style={styles.staffInfo}>
                            <Text style={[styles.staffName, { color: c.text }]}>{staff.name}</Text>
                            <Text style={[styles.staffRole, { color: c.textSub }]}>{staff.role}</Text>
                          </View>
                          <View style={[styles.checkPillBtn, { backgroundColor: c.cardBg, borderColor: c.border }]}>
                            <Text style={[styles.checkPillBtnText, { color: c.text }]}>Activo</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ===================== VIEW: PROGRAMACIÓN (EVENTS LIST) ===================== */}
            {page === 'events' && (
              <View style={styles.eventsPageWrap}>
                {/* Stage Filters Row */}
                <View style={[styles.eventsFilterContainer, { backgroundColor: c.cardBg, borderColor: c.border }]}>
                  <Text style={[styles.filterLabel, { color: c.textMuted }]}>Escenario:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {['TODOS', ...stages].map(st => {
                      const active = stageFilter === st;
                      return (
                        <Pressable
                          key={st}
                          onPress={() => setStageFilter(st)}
                          style={[
                            styles.stageFilterChip,
                            active && [styles.stageFilterChipActive, { backgroundColor: c.pillActive }],
                          ]}
                        >
                          <Text
                            style={[
                              styles.stageFilterChipText,
                              { color: active ? c.pillActiveText : c.textMuted },
                              active && { fontWeight: '700' },
                            ]}
                          >
                            {st}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Events Grid */}
                <View style={styles.eventsGridContainer}>
                  {filteredEvents.map(e => {
                    const meta = getStageMeta(e.space);
                    const isConfirmed = e.status === 'CONFIRMED';
                    const isDelayed = e.status === 'DELAYED';

                    return (
                      <View
                        key={e.id}
                        style={[styles.fullEventItemCard, { backgroundColor: c.cardBg, borderColor: c.border }]}
                      >
                        <View style={styles.eventCardHeader}>
                          <View style={[styles.taskSquareBadge, { backgroundColor: meta.bg }]}>
                            <Text style={styles.taskSquareEmoji}>{meta.icon}</Text>
                          </View>
                          <View style={styles.eventCardHeaderInfo}>
                            <Text style={[styles.eventItemArtist, { color: c.text }]}>{e.artist}</Text>
                            <Text style={[styles.eventItemStage, { color: c.textSub }]}>
                              {e.space} · {e.time}
                            </Text>
                          </View>

                          <Pressable
                            onPress={() => handleCycleStatus(e.id)}
                            style={[
                              styles.statusIndicatorBadge,
                              isConfirmed
                                ? { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }
                                : isDelayed
                                ? { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }
                                : { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusIndicatorText,
                                {
                                  color: isConfirmed ? '#16A34A' : isDelayed ? '#D97706' : '#DC2626',
                                },
                              ]}
                            >
                              {e.status}
                            </Text>
                          </Pressable>
                        </View>

                        <View style={[styles.eventItemActions, { borderTopColor: c.borderSubtle }]}>
                          <Pressable
                            onPress={() => openEdit(e)}
                            style={[styles.actionBtnPill, { backgroundColor: c.innerCard, borderColor: c.border }]}
                          >
                            <Edit3 size={13} color={c.text} />
                            <Text style={[styles.actionBtnPillText, { color: c.text }]}>Editar</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => handleCycleStatus(e.id)}
                            style={[styles.actionBtnPill, { backgroundColor: c.innerCard, borderColor: c.border }]}
                          >
                            <RefreshCw size={13} color={c.text} />
                            <Text style={[styles.actionBtnPillText, { color: c.text }]}>Estado</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => handleDelete(e.id)}
                            style={[styles.actionBtnPill, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                          >
                            <Trash2 size={13} color="#DC2626" />
                            <Text style={[styles.actionBtnPillText, { color: '#DC2626' }]}>Eliminar</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ===================== VIEW: FORM (NEW / EDIT) ===================== */}
            {page === 'form' && (
              <View style={[styles.formCardWrap, { backgroundColor: c.cardBg, borderColor: c.border }]}>
                <Text style={[styles.formHeading, { color: c.text }]}>
                  {editingId ? 'Editar Concierto' : 'Incorporar Concierto'}
                </Text>
                <Text style={[styles.formSubtitle, { color: c.textSub }]}>
                  Completa los datos para reflejar la actuación en el cartel
                </Text>

                {/* Artist Name */}
                <View style={styles.formFieldGroup}>
                  <Text style={[styles.formLabel, { color: c.textMuted }]}>NOMBRE DEL ARTISTA</Text>
                  <TextInput
                    placeholder="Ej. DAFT PUNK"
                    placeholderTextColor={c.textSub}
                    style={[styles.formInput, { backgroundColor: c.innerCard, borderColor: c.border, color: c.text }]}
                    value={formArtist}
                    onChangeText={setFormArtist}
                  />
                </View>

                {/* Stage Selection */}
                <View style={styles.formFieldGroup}>
                  <Text style={[styles.formLabel, { color: c.textMuted }]}>ESCENARIO</Text>
                  <View style={styles.stagesPillsRow}>
                    {stages.map(st => {
                      const sel = formSpace === st;
                      return (
                        <Pressable
                          key={st}
                          onPress={() => setFormSpace(st)}
                          style={[
                            styles.stageSelectPill,
                            {
                              backgroundColor: sel ? c.pillActive : c.innerCard,
                              borderColor: sel ? c.pillActive : c.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.stageSelectPillText,
                              { color: sel ? c.pillActiveText : c.text },
                            ]}
                          >
                            {st}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Time */}
                <View style={styles.formFieldGroup}>
                  <Text style={[styles.formLabel, { color: c.textMuted }]}>HORA DE ACTUACIÓN (HH:MM)</Text>
                  <TextInput
                    placeholder="22:30"
                    placeholderTextColor={c.textSub}
                    style={[styles.formInput, { backgroundColor: c.innerCard, borderColor: c.border, color: c.text }]}
                    value={formTime}
                    onChangeText={setFormTime}
                  />
                </View>

                {/* Status */}
                <View style={styles.formFieldGroup}>
                  <Text style={[styles.formLabel, { color: c.textMuted }]}>ESTADO INICIAL</Text>
                  <View style={styles.stagesPillsRow}>
                    {statuses.map(st => {
                      const sel = formStatus === st;
                      return (
                        <Pressable
                          key={st}
                          onPress={() => setFormStatus(st)}
                          style={[
                            styles.stageSelectPill,
                            {
                              backgroundColor: sel ? c.pillActive : c.innerCard,
                              borderColor: sel ? c.pillActive : c.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.stageSelectPillText,
                              { color: sel ? c.pillActiveText : c.text },
                            ]}
                          >
                            {st}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Buttons */}
                <View style={styles.formActionButtons}>
                  <Pressable
                    onPress={handleSave}
                    style={[styles.primarySaveBtn, { backgroundColor: c.pillActive }]}
                  >
                    <Text style={[styles.primarySaveBtnText, { color: c.pillActiveText }]}>
                      {editingId ? 'Guardar Cambios' : 'Añadir Actuación'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setPage('events')}
                    style={[styles.secondaryCancelBtn, { borderColor: c.border }]}
                  >
                    <Text style={[styles.secondaryCancelBtnText, { color: c.textMuted }]}>Cancelar</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* ===================== MOBILE DRAWER NAVIGATION ===================== */}
      {!wide && (
        <Modal
          visible={drawerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setDrawerOpen(false)}
        >
          <View style={styles.drawerOverlay}>
            <Pressable style={styles.drawerDismiss} onPress={() => setDrawerOpen(false)} />

            <View style={[styles.drawerContent, { backgroundColor: c.cardBg, borderColor: c.border }]}>
              {/* Drawer Top */}
              <View style={[styles.drawerTopBar, { borderBottomColor: c.borderSubtle }]}>
                <View style={styles.logoGroup}>
                  <Text style={[styles.logoBold, { color: c.text }]}>fest</Text>
                  <Text style={[styles.logoSub, { color: c.textMuted }]}>ops.</Text>
                </View>

                <Pressable
                  onPress={() => setDrawerOpen(false)}
                  style={[styles.drawerCloseIcon, { backgroundColor: c.innerCard, borderColor: c.border }]}
                >
                  <X size={16} color={c.text} />
                </Pressable>
              </View>

              {/* Operator info */}
              <View style={[styles.drawerUserBox, { backgroundColor: c.innerCard }]}>
                <View style={styles.userAvatar}>
                  <Text style={styles.avatarText}>OP</Text>
                </View>
                <View>
                  <Text style={[styles.userName, { color: c.text }]}>Operador ZGZ</Text>
                  <Text style={[styles.userRole, { color: c.textSub }]}>Live Operations · ZGZ</Text>
                </View>
              </View>

              {/* Nav links */}
              <View style={styles.drawerLinks}>
                <Pressable
                  onPress={() => {
                    setPage('dashboard');
                    setDrawerOpen(false);
                  }}
                  style={[
                    styles.drawerLinkItem,
                    page === 'dashboard' && [styles.drawerLinkItemActive, { backgroundColor: c.innerCard }],
                  ]}
                >
                  <LayoutDashboard size={18} color={page === 'dashboard' ? c.text : c.textMuted} />
                  <Text style={[styles.drawerLinkText, { color: page === 'dashboard' ? c.text : c.textMuted }]}>
                    Festival Dashboard
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setPage('events');
                    setDrawerOpen(false);
                  }}
                  style={[
                    styles.drawerLinkItem,
                    page === 'events' && [styles.drawerLinkItemActive, { backgroundColor: c.innerCard }],
                  ]}
                >
                  <Calendar size={18} color={page === 'events' ? c.text : c.textMuted} />
                  <Text style={[styles.drawerLinkText, { color: page === 'events' ? c.text : c.textMuted }]}>
                    Programación
                  </Text>
                  <View style={[styles.drawerBadgeCount, { backgroundColor: c.pillActive }]}>
                    <Text style={[styles.drawerBadgeCountText, { color: c.pillActiveText }]}>
                      {events.length}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={openNew}
                  style={[
                    styles.drawerLinkItem,
                    page === 'form' && !editingId && [styles.drawerLinkItemActive, { backgroundColor: c.innerCard }],
                  ]}
                >
                  <Plus size={18} color={page === 'form' ? c.text : c.textMuted} />
                  <Text style={[styles.drawerLinkText, { color: page === 'form' ? c.text : c.textMuted }]}>
                    Nueva Actuación
                  </Text>
                </Pressable>
              </View>

              {/* Drawer Stages List */}
              <View style={styles.drawerStagesSection}>
                <Text style={[styles.drawerSectionHeading, { color: c.textSub }]}>ESCENARIOS</Text>
                {stages.map(st => (
                  <Pressable
                    key={st}
                    onPress={() => {
                      setStageFilter(st);
                      setPage('events');
                      setDrawerOpen(false);
                    }}
                    style={styles.drawerStageRowItem}
                  >
                    <MapPin size={13} color={c.textSub} />
                    <Text style={[styles.drawerStageRowText, { color: c.text }]}>{st}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Drawer Bottom Actions */}
              <View style={[styles.drawerBottomActions, { borderTopColor: c.borderSubtle }]}>
                <Pressable
                  onPress={() => {
                    setDrawerOpen(false);
                    setApiModalOpen(true);
                  }}
                  style={[styles.drawerBtnAction, { backgroundColor: c.innerCard, borderColor: c.border }]}
                >
                  <Database size={15} color={backendSource === 'dynamodb' ? '#16A34A' : c.text} />
                  <Text style={[styles.drawerBtnActionText, { color: c.text }]}>
                    {backendSource === 'dynamodb' ? 'DynamoDB Conectado' : 'Conectar DynamoDB'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setIsDark(!isDark)}
                  style={[styles.drawerBtnAction, { backgroundColor: c.innerCard, borderColor: c.border }]}
                >
                  {isDark ? <Sun size={15} color={c.text} /> : <Moon size={15} color={c.text} />}
                  <Text style={[styles.drawerBtnActionText, { color: c.text }]}>
                    {isDark ? 'Modo Claro' : 'Modo Oscuro'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ===================== DYNAMODB / API GATEWAY MODAL ===================== */}
      <Modal
        visible={apiModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setApiModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismiss} onPress={() => setApiModalOpen(false)} />
          <View style={[styles.modalCard, { backgroundColor: c.cardBg, borderColor: c.border }]}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleGroup}>
                <Database size={18} color={c.text} />
                <Text style={[styles.modalTitle, { color: c.text }]}>Conexión con Amazon DynamoDB</Text>
              </View>
              <Pressable onPress={() => setApiModalOpen(false)}>
                <X size={18} color={c.textSub} />
              </Pressable>
            </View>

            <Text style={[styles.modalDesc, { color: c.textMuted }]}>
              Pega la URL de tu API Gateway desplegada con la plantilla de backend (`backend/template.yaml`).
            </Text>

            <View style={styles.formFieldGroup}>
              <Text style={[styles.formLabel, { color: c.textMuted }]}>URL DE API GATEWAY</Text>
              <TextInput
                placeholder="https://xxxx.execute-api.us-east-1.amazonaws.com"
                placeholderTextColor={c.textSub}
                style={[styles.formInput, { backgroundColor: c.innerCard, borderColor: c.border, color: c.text }]}
                value={apiUrlInput}
                onChangeText={setApiUrlInput}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalStatusChipRow}>
              <View
                style={[
                  styles.statusIndicatorBadge,
                  backendSource === 'dynamodb'
                    ? { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }
                    : { backgroundColor: c.innerCard, borderColor: c.border },
                ]}
              >
                <Text
                  style={[
                    styles.statusIndicatorText,
                    { color: backendSource === 'dynamodb' ? '#16A34A' : c.textMuted },
                  ]}
                >
                  Estado: {backendSource === 'dynamodb' ? 'Conectado a DynamoDB' : 'Almacén Local'}
                </Text>
              </View>
            </View>

            <View style={styles.formActionButtons}>
              <Pressable onPress={handleConnectApi} style={[styles.primarySaveBtn, { backgroundColor: c.pillActive }]}>
                <Text style={[styles.primarySaveBtnText, { color: c.pillActiveText }]}>Guardar y Sincronizar</Text>
              </Pressable>
              <Pressable onPress={() => setApiModalOpen(false)} style={[styles.secondaryCancelBtn, { borderColor: c.border }]}>
                <Text style={[styles.secondaryCancelBtnText, { color: c.textMuted }]}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 36 : 12,
  },
  outerShell: {
    flex: 1,
    marginHorizontal: Platform.OS === 'web' ? 18 : 6,
    marginVertical: Platform.OS === 'web' ? 14 : 4,
    borderRadius: Platform.OS === 'web' ? 28 : 20,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // Global Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mobileMenuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoBold: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  logoSub: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Segmented Container (Center of Header in Panze Studio)
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 22,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  segmentPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  segmentPillActive: {
    elevation: 2,
  },
  segmentPillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Utilities
  utilitiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  userProfileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 6,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  userName: {
    fontSize: 12,
    fontWeight: '800',
  },
  userRole: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Body Layout
  bodyLayout: {
    flex: 1,
    flexDirection: 'row',
  },

  // Left Icon Rail
  iconRail: {
    width: 68,
    borderRightWidth: 1,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  railTopGroup: {
    gap: 14,
    alignItems: 'center',
  },
  railIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railIconCircleActive: {
    elevation: 4,
  },
  railBottomGroup: {
    alignItems: 'center',
  },

  // Workspace Scroll Area
  workspaceScroll: {
    flex: 1,
  },
  workspaceContent: {
    padding: 22,
    paddingBottom: 60,
    gap: 20,
  },

  // Sub Header
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  subHeaderKicker: {
    fontSize: 12,
    fontWeight: '500',
  },
  subHeaderTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: 2,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    minWidth: 280,
  },
  searchPillInput: {
    flex: 1,
    fontSize: 12,
    padding: 0,
  },
  feedbackChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  feedbackChipText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '600',
  },

  // Dashboard 3-Column Grid
  dashboardGrid: {
    flexDirection: 'column',
    gap: 18,
  },
  dashboardGridDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  columnCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  centerColGroup: {
    flex: 2,
    gap: 18,
  },
  middleSplitRow: {
    flexDirection: 'column',
    gap: 18,
  },
  middleSplitRowDesktop: {
    flexDirection: 'row',
  },

  // Card Header Common
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  plusCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tasks Filter
  tasksFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  taskFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  taskFilterPillActive: {},
  taskFilterPillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Ongoing Badge
  ongoingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ongoingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ongoingCountCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ongoingCountText: {
    fontSize: 10,
    fontWeight: '900',
  },
  ongoingText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Task Cards List
  taskCardsList: {
    gap: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  taskSquareBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskSquareEmoji: {
    fontSize: 16,
  },
  taskCardBody: {
    flex: 1,
  },
  taskArtistName: {
    fontSize: 13,
    fontWeight: '800',
  },
  taskStageTime: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  taskCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckConfirmed: {
    borderColor: '#16A34A',
    backgroundColor: '#DCFCE7',
  },
  taskCheckDelayed: {
    borderColor: '#F97316',
    backgroundColor: '#FFEDD5',
  },
  viewMoreRow: {
    alignItems: 'center',
    paddingTop: 4,
  },
  viewMoreText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Donut Chart
  donutCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  donutLegendRow: {
    gap: 6,
    marginTop: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Wave Chart
  waveLegendInfo: {
    gap: 2,
    marginBottom: 4,
  },
  waveSvgWrap: {
    height: 65,
    overflow: 'hidden',
  },
  waveMonthsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  waveMonthText: {
    fontSize: 9,
    fontWeight: '600',
  },

  // Progress Bars (Invoice Overview)
  progressBarsStack: {
    gap: 12,
  },
  barBlock: {
    gap: 6,
  },
  barLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barName: {
    fontSize: 12,
    fontWeight: '700',
  },
  barStat: {
    fontSize: 11,
    fontWeight: '600',
  },
  barTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },

  // Meetings Column
  meetingCardsStack: {
    gap: 10,
  },
  meetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  meetingTime: {
    fontSize: 10,
    fontWeight: '700',
  },
  meetingTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  meetingArtist: {
    fontSize: 11,
    fontWeight: '500',
  },
  seeAllRow: {
    paddingVertical: 2,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Tickets / Staff Section
  ticketsSection: {
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 10,
  },
  ticketStaffList: {
    gap: 8,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  staffAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 11,
    fontWeight: '800',
  },
  staffRole: {
    fontSize: 10,
    fontWeight: '500',
  },
  checkPillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  checkPillBtnText: {
    fontSize: 9,
    fontWeight: '800',
  },

  // Events Full View
  eventsPageWrap: {
    gap: 16,
  },
  eventsFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  stageFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  stageFilterChipActive: {},
  stageFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  fullEventItemCard: {
    flex: 1,
    minWidth: 280,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eventCardHeaderInfo: {
    flex: 1,
  },
  eventItemArtist: {
    fontSize: 15,
    fontWeight: '800',
  },
  eventItemStage: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  statusIndicatorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusIndicatorText: {
    fontSize: 9,
    fontWeight: '800',
  },
  eventItemActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  actionBtnPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnPillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Form View
  formCardWrap: {
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 18,
  },
  formHeading: {
    fontSize: 20,
    fontWeight: '900',
  },
  formSubtitle: {
    fontSize: 12,
    marginTop: -10,
  },
  formFieldGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  formInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  stagesPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stageSelectPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  stageSelectPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  formActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  primarySaveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 20,
  },
  primarySaveBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 20,
    borderWidth: 1,
  },
  secondaryCancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Mobile Drawer Navigation
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flexDirection: 'row',
  },
  drawerDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  drawerContent: {
    width: 285,
    height: '100%',
    borderRightWidth: 1,
    padding: 20,
    gap: 14,
  },
  drawerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  drawerCloseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerUserBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
  },
  drawerLinks: {
    gap: 4,
  },
  drawerLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  drawerLinkItemActive: {},
  drawerLinkText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  drawerBadgeCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  drawerBadgeCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  drawerStagesSection: {
    gap: 6,
    paddingTop: 8,
  },
  drawerSectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  drawerStageRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  drawerStageRowText: {
    fontSize: 12,
    fontWeight: '600',
  },
  drawerBottomActions: {
    marginTop: 'auto',
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  drawerBtnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  drawerBtnActionText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    gap: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  modalStatusChipRow: {
    flexDirection: 'row',
  },
});
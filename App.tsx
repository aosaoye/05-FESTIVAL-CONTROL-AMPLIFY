import { useMemo, useState } from 'react';
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
} from 'react-native';
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  Menu,
  X,
  Search,
  Moon,
  Sun,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Trash2,
  Edit3,
  RefreshCw,
  User,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { initialEvents, FestivalEvent, EventStatus } from './src/data';
import { themes, ThemeMode, ThemeColors } from './src/theme';

type Page = 'dashboard' | 'events' | 'form';
const stages = ['MAIN STAGE', 'GARDEN', 'WAREHOUSE', 'RIVER STAGE'] as const;
const statuses: EventStatus[] = ['CONFIRMED', 'DELAYED', 'CANCELLED'];

export default function App() {
  const { width } = useWindowDimensions();
  const wide = width >= 920;

  // State
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [page, setPage] = useState<Page>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [events, setEvents] = useState<FestivalEvent[]>(initialEvents);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('TODOS');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formArtist, setFormArtist] = useState('');
  const [formSpace, setFormSpace] = useState<string>(stages[0]);
  const [formTime, setFormTime] = useState('22:00');
  const [formStatus, setFormStatus] = useState<EventStatus>('CONFIRMED');
  const [feedback, setFeedback] = useState('');

  const t: ThemeColors = themes[themeMode];

  // Metrics
  const total = events.length;
  const confirmed = useMemo(() => events.filter(e => e.status === 'CONFIRMED').length, [events]);
  const delayed = useMemo(() => events.filter(e => e.status === 'DELAYED').length, [events]);
  const cancelled = useMemo(() => events.filter(e => e.status === 'CANCELLED').length, [events]);

  const confirmedPct = total > 0 ? Math.round((confirmed / total) * 100) : 0;
  const delayedPct = total > 0 ? Math.round((delayed / total) * 100) : 0;
  const cancelledPct = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  // Next headliner or confirmed act
  const headliner = useMemo(
    () => events.find(e => e.space === 'MAIN STAGE' && e.status === 'CONFIRMED') || events[0],
    [events]
  );

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

  // Actions
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

  const handleSave = () => {
    if (!formArtist.trim() || !/^([01]\d|2[0-3]):[0-5]\d$/.test(formTime)) {
      setFeedback('Introduce el nombre del artista y una hora válida (HH:MM).');
      return;
    }

    if (editingId) {
      setEvents(prev =>
        prev.map(e =>
          e.id === editingId
            ? {
                ...e,
                artist: formArtist.trim().toUpperCase(),
                space: formSpace,
                time: formTime,
                status: formStatus,
              }
            : e
        )
      );
      setFeedback(`Actuación "${formArtist.trim().toUpperCase()}" actualizada.`);
    } else {
      const newId = 'EVT-' + Math.floor(100 + Math.random() * 900);
      setEvents(prev => [
        {
          id: newId,
          artist: formArtist.trim().toUpperCase(),
          space: formSpace,
          time: formTime,
          status: formStatus,
        },
        ...prev,
      ]);
      setFeedback(`"${formArtist.trim().toUpperCase()}" añadida a la programación.`);
    }
    setPage('events');
  };

  const handleCycleStatus = (id: string) => {
    setEvents(prev =>
      prev.map(e => {
        if (e.id !== id) return e;
        const next: EventStatus =
          e.status === 'CONFIRMED'
            ? 'DELAYED'
            : e.status === 'DELAYED'
            ? 'CANCELLED'
            : 'CONFIRMED';
        return { ...e, status: next };
      })
    );
  };

  const handleDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setFeedback('Actuación eliminada.');
  };

  const toggleTheme = () => {
    setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const getStatusBadge = (status: EventStatus) => {
    if (status === 'CONFIRMED') {
      return {
        bg: t.greenBg,
        border: t.greenBorder,
        color: t.green,
        label: 'Confirmado',
        Icon: CheckCircle2,
      };
    }
    if (status === 'DELAYED') {
      return {
        bg: t.amberBg,
        border: t.amberBorder,
        color: t.amber,
        label: 'Retrasado',
        Icon: AlertCircle,
      };
    }
    return {
      bg: t.redBg,
      border: t.redBorder,
      color: t.red,
      label: 'Cancelado',
      Icon: XCircle,
    };
  };

  return (
    <SafeAreaView style={[styles.viewport, { backgroundColor: t.bg }]}>
      {/* ===================== FLOATING APPLICATION SHELL ===================== */}
      <View style={[styles.shell, { backgroundColor: t.shellBg, borderColor: t.border }]}>
        {/* ===================== GLOBAL PERSISTENT HEADER ===================== */}
        <View style={[styles.globalHeader, { borderBottomColor: t.borderSubtle }]}>
          {/* Left: Mobile Drawer Trigger / Brand */}
          <View style={styles.headerLeft}>
            {!wide && (
              <Pressable
                accessibilityLabel="Abrir menú de navegación"
                onPress={() => setDrawerOpen(true)}
                style={[styles.hamburgerBtn, { borderColor: t.border, backgroundColor: t.cardElevated }]}
              >
                <Menu size={18} color={t.text} />
              </Pressable>
            )}

            <View style={styles.brandGroup}>
              <View style={[styles.brandMark, { backgroundColor: t.primary }]}>
                <Radio size={14} color={t.primaryText} />
              </View>
              <View>
                <Text style={[styles.brandName, { color: t.text }]}>FestOps</Text>
                <Text style={[styles.brandTag, { color: t.textSub }]}>ZARAGOZA · 2026</Text>
              </View>
            </View>
          </View>

          {/* Center: Stage quick selector pills (Desktop) */}
          {wide && (
            <View style={styles.headerCenter}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.headerPills}>
                {['TODOS', ...stages].map(st => {
                  const active = stageFilter === st;
                  return (
                    <Pressable
                      key={st}
                      onPress={() => {
                        setStageFilter(st);
                        if (page === 'form') setPage('dashboard');
                      }}
                      style={[
                        styles.headerPill,
                        {
                          backgroundColor: active ? t.primary : t.cardElevated,
                          borderColor: active ? t.primary : t.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.headerPillText,
                          { color: active ? t.primaryText : t.textMuted },
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
          )}

          {/* Right: Live badge + Theme Switch + Operator Profile */}
          <View style={styles.headerRight}>
            <View style={[styles.liveChip, { backgroundColor: t.greenBg, borderColor: t.greenBorder }]}>
              <View style={[styles.livePulse, { backgroundColor: t.green }]} />
              <Text style={[styles.liveChipText, { color: t.green }]}>EN VIVO</Text>
            </View>

            <Pressable
              accessibilityLabel="Alternar modo claro y oscuro"
              onPress={toggleTheme}
              style={[styles.iconBtn, { borderColor: t.border, backgroundColor: t.cardElevated }]}
            >
              {themeMode === 'dark' ? <Sun size={16} color={t.text} /> : <Moon size={16} color={t.text} />}
            </Pressable>

            {wide && (
              <View style={[styles.profileChip, { borderColor: t.border, backgroundColor: t.cardElevated }]}>
                <View style={[styles.profileAvatar, { backgroundColor: t.primary }]}>
                  <User size={13} color={t.primaryText} />
                </View>
                <View>
                  <Text style={[styles.profileName, { color: t.text }]}>Operador ZGZ</Text>
                  <Text style={[styles.profileRole, { color: t.textSub }]}>Control Central</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ===================== BODY: RAIL + WORKSPACE ===================== */}
        <View style={styles.shellBody}>
          {/* Desktop Left Rail Navigation (panze studio style) */}
          {wide && (
            <View style={[styles.leftRail, { borderRightColor: t.borderSubtle, backgroundColor: t.railBg }]}>
              <View style={styles.railNavGroup}>
                <Pressable
                  accessibilityLabel="Ir al Dashboard"
                  onPress={() => setPage('dashboard')}
                  style={[
                    styles.railBtn,
                    page === 'dashboard' && [styles.railBtnActive, { backgroundColor: t.railActive }],
                  ]}
                >
                  <LayoutDashboard size={20} color={page === 'dashboard' ? t.text : t.textMuted} />
                  <Text style={[styles.railTooltip, { color: page === 'dashboard' ? t.text : t.textSub }]}>
                    Panel
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityLabel="Ir a Programación"
                  onPress={() => setPage('events')}
                  style={[
                    styles.railBtn,
                    page === 'events' && [styles.railBtnActive, { backgroundColor: t.railActive }],
                  ]}
                >
                  <Calendar size={20} color={page === 'events' ? t.text : t.textMuted} />
                  <Text style={[styles.railTooltip, { color: page === 'events' ? t.text : t.textSub }]}>
                    Eventos
                  </Text>
                  <View style={[styles.railBadge, { backgroundColor: t.primary }]}>
                    <Text style={[styles.railBadgeText, { color: t.primaryText }]}>{events.length}</Text>
                  </View>
                </Pressable>

                <Pressable
                  accessibilityLabel="Crear nuevo evento"
                  onPress={openNew}
                  style={[
                    styles.railBtn,
                    page === 'form' && !editingId && [styles.railBtnActive, { backgroundColor: t.railActive }],
                  ]}
                >
                  <PlusCircle size={20} color={page === 'form' ? t.text : t.textMuted} />
                  <Text style={[styles.railTooltip, { color: page === 'form' ? t.text : t.textSub }]}>
                    Nuevo
                  </Text>
                </Pressable>
              </View>

              <View style={styles.railFooter}>
                <Pressable
                  accessibilityLabel="Cambiar tema"
                  onPress={toggleTheme}
                  style={[styles.railBtn, { backgroundColor: t.cardElevated, borderColor: t.border, borderWidth: 1 }]}
                >
                  {themeMode === 'dark' ? <Sun size={18} color={t.text} /> : <Moon size={18} color={t.text} />}
                </Pressable>
              </View>
            </View>
          )}

          {/* ===================== WORKSPACE SCROLL CONTENT ===================== */}
          <ScrollView
            style={styles.workspaceScroll}
            contentContainerStyle={styles.workspaceContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Feedback notification banner */}
            {!!feedback && (
              <View style={[styles.feedbackBanner, { backgroundColor: t.greenBg, borderColor: t.greenBorder }]}>
                <CheckCircle2 size={16} color={t.green} />
                <Text style={[styles.feedbackText, { color: t.green }]}>{feedback}</Text>
              </View>
            )}

            {/* Title Header with Search Bar */}
            <View style={styles.titleSection}>
              <View>
                <Text style={[styles.kickerText, { color: t.textSub }]}>OPERACIONES Y HORARIOS EN DIRECTO</Text>
                <Text style={[styles.h1Text, { color: t.text }]}>
                  {page === 'dashboard'
                    ? 'Panel de Control'
                    : page === 'events'
                    ? 'Programación del Festival'
                    : editingId
                    ? 'Editar Actuación'
                    : 'Añadir Actuación'}
                </Text>
              </View>

              <View style={[styles.searchBox, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
                <Search size={16} color={t.textSub} />
                <TextInput
                  placeholder="Buscar artista, escenario, ID..."
                  placeholderTextColor={t.textSub}
                  style={[styles.searchInput, { color: t.text }]}
                  value={search}
                  onChangeText={setSearch}
                />
                {!!search && (
                  <Pressable onPress={() => setSearch('')}>
                    <X size={14} color={t.textSub} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* ===================== PAGE: DASHBOARD ===================== */}
            {page === 'dashboard' && (
              <View style={styles.dashboardGrid}>
                {/* Column 1: Timeline / Live Feed ("Transactions" style) */}
                <View style={[styles.dashCard, { backgroundColor: t.card, borderColor: t.border }]}>
                  <View style={styles.cardTopRow}>
                    <View>
                      <Text style={[styles.cardTitle, { color: t.text }]}>Próximas Actuaciones</Text>
                      <Text style={[styles.cardSub, { color: t.textSub }]}>{events.length} programadas</Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={openNew}
                      style={[styles.smallActionBtn, { backgroundColor: t.cardElevated, borderColor: t.border }]}
                    >
                      <PlusCircle size={14} color={t.text} />
                      <Text style={[styles.smallActionBtnText, { color: t.text }]}>Añadir</Text>
                    </Pressable>
                  </View>

                  <View style={styles.feedList}>
                    {events.slice(0, 5).map(e => {
                      const badge = getStatusBadge(e.status);
                      const BadgeIcon = badge.Icon;
                      return (
                        <View
                          key={e.id}
                          style={[styles.feedRow, { borderColor: t.borderSubtle, backgroundColor: t.cardElevated }]}
                        >
                          <View style={styles.feedRowMain}>
                            <View style={[styles.timeBox, { backgroundColor: t.borderSubtle }]}>
                              <Clock size={12} color={t.textMuted} />
                              <Text style={[styles.timeBoxText, { color: t.text }]}>{e.time}</Text>
                            </View>

                            <View style={styles.artistInfo}>
                              <Text style={[styles.artistName, { color: t.text }]}>{e.artist}</Text>
                              <View style={styles.stageLocationRow}>
                                <MapPin size={11} color={t.textSub} />
                                <Text style={[styles.stageLocationText, { color: t.textSub }]}>
                                  {e.space} · {e.id}
                                </Text>
                              </View>
                            </View>

                            <Pressable
                              onPress={() => handleCycleStatus(e.id)}
                              style={[
                                styles.statusPill,
                                { backgroundColor: badge.bg, borderColor: badge.border },
                              ]}
                            >
                              <BadgeIcon size={12} color={badge.color} />
                              <Text style={[styles.statusPillText, { color: badge.color }]}>
                                {badge.label}
                              </Text>
                            </Pressable>
                          </View>

                          <View style={[styles.rowActions, { borderTopColor: t.borderSubtle }]}>
                            <Pressable onPress={() => openEdit(e)} style={styles.actionLink}>
                              <Edit3 size={12} color={t.textMuted} />
                              <Text style={[styles.actionLinkText, { color: t.textMuted }]}>Editar</Text>
                            </Pressable>
                            <Pressable onPress={() => handleCycleStatus(e.id)} style={styles.actionLink}>
                              <RefreshCw size={12} color={t.primary} />
                              <Text style={[styles.actionLinkText, { color: t.primary }]}>Cambiar Estado</Text>
                            </Pressable>
                            <Pressable onPress={() => handleDelete(e.id)} style={styles.actionLink}>
                              <Trash2 size={12} color={t.red} />
                              <Text style={[styles.actionLinkText, { color: t.red }]}>Eliminar</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  <Pressable onPress={() => setPage('events')} style={styles.viewAllFooter}>
                    <Text style={[styles.viewAllText, { color: t.primary }]}>Ver toda la programación →</Text>
                  </Pressable>
                </View>

                {/* Column 2: Status Distribution & Headliner Card */}
                <View style={styles.dashColMiddle}>
                  {/* Status Progress Bars (panze studio invoice/project overview style) */}
                  <View style={[styles.dashCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <View style={styles.cardTopRow}>
                      <View>
                        <Text style={[styles.cardTitle, { color: t.text }]}>Estado General</Text>
                        <Text style={[styles.cardSub, { color: t.textSub }]}>Métricas en vivo</Text>
                      </View>
                      <View style={[styles.metricCountBadge, { backgroundColor: t.cardElevated }]}>
                        <Text style={[styles.metricCountText, { color: t.text }]}>{total} Actos</Text>
                      </View>
                    </View>

                    {/* Bars */}
                    <View style={styles.barsGroup}>
                      {/* Confirmados */}
                      <View style={styles.barItem}>
                        <View style={styles.barLabelRow}>
                          <View style={styles.barTitleGroup}>
                            <CheckCircle2 size={13} color={t.green} />
                            <Text style={[styles.barTitleText, { color: t.text }]}>Confirmados</Text>
                          </View>
                          <Text style={[styles.barValueText, { color: t.green }]}>
                            {confirmed} ({confirmedPct}%)
                          </Text>
                        </View>
                        <View style={[styles.progressTrack, { backgroundColor: t.borderSubtle }]}>
                          <View
                            style={[
                              styles.progressFill,
                              { backgroundColor: t.green, width: `${confirmedPct}%` },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Retrasados */}
                      <View style={styles.barItem}>
                        <View style={styles.barLabelRow}>
                          <View style={styles.barTitleGroup}>
                            <AlertCircle size={13} color={t.amber} />
                            <Text style={[styles.barTitleText, { color: t.text }]}>Retrasados</Text>
                          </View>
                          <Text style={[styles.barValueText, { color: t.amber }]}>
                            {delayed} ({delayedPct}%)
                          </Text>
                        </View>
                        <View style={[styles.progressTrack, { backgroundColor: t.borderSubtle }]}>
                          <View
                            style={[
                              styles.progressFill,
                              { backgroundColor: t.amber, width: `${delayedPct}%` },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Cancelados */}
                      <View style={styles.barItem}>
                        <View style={styles.barLabelRow}>
                          <View style={styles.barTitleGroup}>
                            <XCircle size={13} color={t.red} />
                            <Text style={[styles.barTitleText, { color: t.text }]}>Cancelados</Text>
                          </View>
                          <Text style={[styles.barValueText, { color: t.red }]}>
                            {cancelled} ({cancelledPct}%)
                          </Text>
                        </View>
                        <View style={[styles.progressTrack, { backgroundColor: t.borderSubtle }]}>
                          <View
                            style={[
                              styles.progressFill,
                              { backgroundColor: t.red, width: `${cancelledPct}%` },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Headliner Spotlight Card */}
                  <View style={[styles.spotlightCard, { backgroundColor: t.primary, borderColor: t.border }]}>
                    <View style={styles.spotlightTop}>
                      <View style={styles.spotlightBadge}>
                        <Sparkles size={12} color={t.primaryText} />
                        <Text style={[styles.spotlightBadgeText, { color: t.primaryText }]}>HEADLINER</Text>
                      </View>
                      <Text style={[styles.spotlightTime, { color: t.primaryText }]}>
                        {headliner ? headliner.time : '23:00'}
                      </Text>
                    </View>

                    <Text style={[styles.spotlightArtist, { color: t.primaryText }]}>
                      {headliner ? headliner.artist : 'NEON WAVES'}
                    </Text>
                    <Text style={[styles.spotlightStage, { color: t.primaryText, opacity: 0.8 }]}>
                      {headliner ? headliner.space : 'MAIN STAGE'} · Escenario Principal
                    </Text>

                    <Pressable
                      onPress={() => {
                        if (headliner) openEdit(headliner);
                      }}
                      style={[styles.spotlightBtn, { backgroundColor: t.shellBg }]}
                    >
                      <Text style={[styles.spotlightBtnText, { color: t.text }]}>Gestionar Actuación</Text>
                      <ChevronRight size={14} color={t.text} />
                    </Pressable>
                  </View>
                </View>

                {/* Column 3: Escenarios del Festival (4 active stages) */}
                <View style={[styles.dashCard, { backgroundColor: t.card, borderColor: t.border }]}>
                  <View style={styles.cardTopRow}>
                    <View>
                      <Text style={[styles.cardTitle, { color: t.text }]}>Escenarios Activos</Text>
                      <Text style={[styles.cardSub, { color: t.textSub }]}>4 ubicaciones en directo</Text>
                    </View>
                  </View>

                  <View style={styles.stagesStack}>
                    {stages.map((st, i) => {
                      const count = events.filter(e => e.space === st).length;
                      const next = events.find(e => e.space === st);
                      return (
                        <Pressable
                          key={st}
                          onPress={() => {
                            setStageFilter(st);
                            setPage('events');
                          }}
                          style={[styles.stageCard, { backgroundColor: t.cardElevated, borderColor: t.borderSubtle }]}
                        >
                          <View style={styles.stageCardHeader}>
                            <View style={styles.stageTitleRow}>
                              <View style={[styles.stageIndexBadge, { backgroundColor: t.borderSubtle }]}>
                                <Text style={[styles.stageIndexText, { color: t.text }]}>{`0${i + 1}`}</Text>
                              </View>
                              <Text style={[styles.stageTitle, { color: t.text }]}>{st}</Text>
                            </View>
                            <View style={[styles.stageCountChip, { backgroundColor: t.borderSubtle }]}>
                              <Text style={[styles.stageCountChipText, { color: t.text }]}>{count} acts</Text>
                            </View>
                          </View>

                          <Text style={[styles.stageNextText, { color: t.textSub }]}>
                            {next ? `Próximo: ${next.artist} (${next.time})` : 'Sin actuaciones programadas'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* ===================== PAGE: PROGRAMACIÓN (EVENTS) ===================== */}
            {page === 'events' && (
              <View style={styles.eventsContainer}>
                {/* Stage Filters Bar */}
                <View style={[styles.filterBar, { backgroundColor: t.card, borderColor: t.border }]}>
                  <View style={styles.filterBarLeft}>
                    <SlidersHorizontal size={16} color={t.textMuted} />
                    <Text style={[styles.filterBarTitle, { color: t.text }]}>Filtrar por Escenario:</Text>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
                    {['TODOS', ...stages].map(st => {
                      const active = stageFilter === st;
                      return (
                        <Pressable
                          key={st}
                          onPress={() => setStageFilter(st)}
                          style={[
                            styles.filterPillItem,
                            {
                              backgroundColor: active ? t.primary : t.cardElevated,
                              borderColor: active ? t.primary : t.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterPillItemText,
                              { color: active ? t.primaryText : t.textMuted },
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

                {/* Grid of full cards */}
                {filteredEvents.length === 0 ? (
                  <View style={[styles.emptyContainer, { backgroundColor: t.card, borderColor: t.border }]}>
                    <Search size={32} color={t.textSub} />
                    <Text style={[styles.emptyTitle, { color: t.text }]}>Sin resultados</Text>
                    <Text style={[styles.emptySubtitle, { color: t.textSub }]}>
                      No hay eventos que coincidan con los filtros seleccionados.
                    </Text>
                    <Pressable
                      onPress={() => {
                        setSearch('');
                        setStageFilter('TODOS');
                      }}
                      style={[styles.emptyResetBtn, { backgroundColor: t.primary }]}
                    >
                      <Text style={[styles.emptyResetBtnText, { color: t.primaryText }]}>Restablecer filtros</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.eventsGrid}>
                    {filteredEvents.map(e => {
                      const badge = getStatusBadge(e.status);
                      const BadgeIcon = badge.Icon;
                      return (
                        <View
                          key={e.id}
                          style={[styles.eventDetailCard, { backgroundColor: t.card, borderColor: t.border }]}
                        >
                          <View style={styles.eventCardTop}>
                            <View style={[styles.timeTag, { backgroundColor: t.cardElevated, borderColor: t.border }]}>
                              <Clock size={12} color={t.textMuted} />
                              <Text style={[styles.timeTagText, { color: t.text }]}>{e.time}</Text>
                            </View>

                            <Pressable
                              onPress={() => handleCycleStatus(e.id)}
                              style={[
                                styles.statusPill,
                                { backgroundColor: badge.bg, borderColor: badge.border },
                              ]}
                            >
                              <BadgeIcon size={12} color={badge.color} />
                              <Text style={[styles.statusPillText, { color: badge.color }]}>{badge.label}</Text>
                            </Pressable>
                          </View>

                          <Text style={[styles.eventArtistTitle, { color: t.text }]}>{e.artist}</Text>

                          <View style={styles.eventMetaRow}>
                            <MapPin size={13} color={t.textSub} />
                            <Text style={[styles.eventMetaText, { color: t.textSub }]}>
                              {e.space} · ID: {e.id}
                            </Text>
                          </View>

                          <View style={[styles.eventActionsRow, { borderTopColor: t.borderSubtle }]}>
                            <Pressable
                              onPress={() => openEdit(e)}
                              style={[styles.smallBtnOutline, { borderColor: t.border, backgroundColor: t.cardElevated }]}
                            >
                              <Edit3 size={13} color={t.text} />
                              <Text style={[styles.smallBtnOutlineText, { color: t.text }]}>Editar</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => handleCycleStatus(e.id)}
                              style={[styles.smallBtnOutline, { borderColor: t.border, backgroundColor: t.cardElevated }]}
                            >
                              <RefreshCw size={13} color={t.primary} />
                              <Text style={[styles.smallBtnOutlineText, { color: t.primary }]}>Estado</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => handleDelete(e.id)}
                              style={[styles.smallBtnOutline, { borderColor: t.redBorder, backgroundColor: t.redBg }]}
                            >
                              <Trash2 size={13} color={t.red} />
                              <Text style={[styles.smallBtnOutlineText, { color: t.red }]}>Eliminar</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* ===================== PAGE: FORM (CREAR / EDITAR) ===================== */}
            {page === 'form' && (
              <View style={[styles.formContainer, { backgroundColor: t.card, borderColor: t.border }]}>
                <View style={styles.formTopInfo}>
                  <Text style={[styles.formMainHeading, { color: t.text }]}>
                    {editingId ? 'Editar Concierto' : 'Crear Nuevo Concierto'}
                  </Text>
                  <Text style={[styles.formSubText, { color: t.textSub }]}>
                    {editingId
                      ? `Modificando registro ${editingId}`
                      : 'Rellena los datos para incorporar la actuación al cartel'}
                  </Text>
                </View>

                {/* Field: Artista */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: t.textMuted }]}>ARTISTA O GRUPO *</Text>
                  <TextInput
                    placeholder="Ej. DAFT PUNK"
                    placeholderTextColor={t.textSub}
                    style={[styles.textInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text }]}
                    value={formArtist}
                    onChangeText={setFormArtist}
                  />
                </View>

                {/* Field: Escenario */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: t.textMuted }]}>ESCENARIO *</Text>
                  <View style={styles.optionsWrap}>
                    {stages.map(st => {
                      const sel = formSpace === st;
                      return (
                        <Pressable
                          key={st}
                          onPress={() => setFormSpace(st)}
                          style={[
                            styles.optionChip,
                            {
                              backgroundColor: sel ? t.primary : t.cardElevated,
                              borderColor: sel ? t.primary : t.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              { color: sel ? t.primaryText : t.text },
                              sel && { fontWeight: '700' },
                            ]}
                          >
                            {st}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Field: Hora */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: t.textMuted }]}>HORA PROGRAMADA (HH:MM) *</Text>
                  <TextInput
                    placeholder="22:30"
                    placeholderTextColor={t.textSub}
                    style={[styles.textInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text }]}
                    value={formTime}
                    onChangeText={setFormTime}
                  />
                </View>

                {/* Field: Estado */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: t.textMuted }]}>ESTADO INICIAL *</Text>
                  <View style={styles.optionsWrap}>
                    {statuses.map(st => {
                      const sel = formStatus === st;
                      const b = getStatusBadge(st);
                      const Icon = b.Icon;
                      return (
                        <Pressable
                          key={st}
                          onPress={() => setFormStatus(st)}
                          style={[
                            styles.optionChip,
                            {
                              backgroundColor: sel ? b.bg : t.cardElevated,
                              borderColor: sel ? b.border : t.border,
                            },
                          ]}
                        >
                          <Icon size={13} color={sel ? b.color : t.textSub} />
                          <Text
                            style={[
                              styles.optionChipText,
                              { color: sel ? b.color : t.textMuted },
                              sel && { fontWeight: '700' },
                            ]}
                          >
                            {b.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.formBtnRow}>
                  <Pressable accessibilityRole="button" onPress={handleSave} style={[styles.saveBtn, { backgroundColor: t.primary }]}>
                    <Text style={[styles.saveBtnText, { color: t.primaryText }]}>
                      {editingId ? 'Guardar Cambios' : 'Añadir Actuación'}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setPage('events')}
                    style={[styles.cancelBtn, { borderColor: t.border }]}
                  >
                    <Text style={[styles.cancelBtnText, { color: t.textMuted }]}>Cancelar</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* ===================== MOBILE DRAWER NAVIGATION (MODAL OVERLAY) ===================== */}
      {!wide && (
        <Modal
          visible={drawerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setDrawerOpen(false)}
        >
          <View style={[styles.drawerBackdrop, { backgroundColor: t.drawerOverlay }]}>
            <Pressable style={styles.drawerBackdropPress} onPress={() => setDrawerOpen(false)} />

            {/* Sliding Drawer Content */}
            <View style={[styles.drawerPanel, { backgroundColor: t.shellBg, borderColor: t.border }]}>
              {/* Drawer Header */}
              <View style={[styles.drawerHeader, { borderBottomColor: t.borderSubtle }]}>
                <View style={styles.brandGroup}>
                  <View style={[styles.brandMark, { backgroundColor: t.primary }]}>
                    <Radio size={14} color={t.primaryText} />
                  </View>
                  <View>
                    <Text style={[styles.brandName, { color: t.text }]}>FestOps</Text>
                    <Text style={[styles.brandTag, { color: t.textSub }]}>DRAWER NAVIGATION</Text>
                  </View>
                </View>

                <Pressable
                  accessibilityLabel="Cerrar menú"
                  onPress={() => setDrawerOpen(false)}
                  style={[styles.drawerCloseBtn, { borderColor: t.border, backgroundColor: t.cardElevated }]}
                >
                  <X size={16} color={t.text} />
                </Pressable>
              </View>

              {/* Drawer Operator Info */}
              <View style={[styles.drawerOperatorCard, { backgroundColor: t.cardElevated, borderColor: t.borderSubtle }]}>
                <View style={[styles.profileAvatar, { backgroundColor: t.primary }]}>
                  <User size={14} color={t.primaryText} />
                </View>
                <View>
                  <Text style={[styles.profileName, { color: t.text }]}>Operador ZGZ</Text>
                  <Text style={[styles.profileRole, { color: t.textSub }]}>Live Operations · ZGZ</Text>
                </View>
              </View>

              {/* Drawer Nav Links */}
              <View style={styles.drawerNavList}>
                <Pressable
                  onPress={() => {
                    setPage('dashboard');
                    setDrawerOpen(false);
                  }}
                  style={[
                    styles.drawerNavItem,
                    page === 'dashboard' && [styles.drawerNavItemActive, { backgroundColor: t.cardElevated, borderColor: t.border }],
                  ]}
                >
                  <LayoutDashboard size={18} color={page === 'dashboard' ? t.primary : t.textMuted} />
                  <Text style={[styles.drawerNavText, { color: page === 'dashboard' ? t.text : t.textMuted }]}>
                    Panel de Control
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setPage('events');
                    setDrawerOpen(false);
                  }}
                  style={[
                    styles.drawerNavItem,
                    page === 'events' && [styles.drawerNavItemActive, { backgroundColor: t.cardElevated, borderColor: t.border }],
                  ]}
                >
                  <Calendar size={18} color={page === 'events' ? t.primary : t.textMuted} />
                  <Text style={[styles.drawerNavText, { color: page === 'events' ? t.text : t.textMuted }]}>
                    Programación
                  </Text>
                  <View style={[styles.drawerBadge, { backgroundColor: t.primary }]}>
                    <Text style={[styles.drawerBadgeText, { color: t.primaryText }]}>{events.length}</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={openNew}
                  style={[
                    styles.drawerNavItem,
                    page === 'form' && !editingId && [styles.drawerNavItemActive, { backgroundColor: t.cardElevated, borderColor: t.border }],
                  ]}
                >
                  <PlusCircle size={18} color={page === 'form' ? t.primary : t.textMuted} />
                  <Text style={[styles.drawerNavText, { color: page === 'form' ? t.text : t.textMuted }]}>
                    Nuevo Concierto
                  </Text>
                </Pressable>
              </View>

              {/* Drawer Stage Shortcuts */}
              <View style={styles.drawerSection}>
                <Text style={[styles.drawerSectionTitle, { color: t.textSub }]}>ESCENARIOS</Text>
                {stages.map(st => (
                  <Pressable
                    key={st}
                    onPress={() => {
                      setStageFilter(st);
                      setPage('events');
                      setDrawerOpen(false);
                    }}
                    style={styles.drawerStageRow}
                  >
                    <MapPin size={13} color={t.textSub} />
                    <Text style={[styles.drawerStageName, { color: t.text }]}>{st}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Drawer Footer: Theme Toggle */}
              <View style={[styles.drawerFooter, { borderTopColor: t.borderSubtle }]}>
                <Pressable
                  onPress={toggleTheme}
                  style={[styles.drawerThemeBtn, { backgroundColor: t.cardElevated, borderColor: t.border }]}
                >
                  {themeMode === 'dark' ? <Sun size={16} color={t.text} /> : <Moon size={16} color={t.text} />}
                  <Text style={[styles.drawerThemeText, { color: t.text }]}>
                    {themeMode === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
  },
  shell: {
    flex: 1,
    margin: 0,
    overflow: 'hidden',
  },

  // Global Header
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hamburgerBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandTag: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerCenter: {
    flex: 1,
    maxWidth: 550,
  },
  headerPills: {
    flexDirection: 'row',
    gap: 8,
  },
  headerPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  profileAvatar: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 12,
    fontWeight: '700',
  },
  profileRole: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Shell Body
  shellBody: {
    flex: 1,
    flexDirection: 'row',
  },

  // Desktop Left Rail
  leftRail: {
    width: 72,
    borderRightWidth: 1,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  railNavGroup: {
    gap: 14,
    alignItems: 'center',
  },
  railBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  railBtnActive: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  railTooltip: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 3,
  },
  railBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  railBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  railFooter: {
    alignItems: 'center',
  },

  // Workspace Scroll
  workspaceScroll: {
    flex: 1,
  },
  workspaceContainer: {
    padding: 24,
    paddingBottom: 60,
    gap: 20,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  kickerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  h1Text: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 260,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    padding: 0,
  },

  // Dashboard 3-Column Grid
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  dashCard: {
    flex: 1,
    minWidth: 280,
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  dashColMiddle: {
    flex: 1,
    minWidth: 280,
    gap: 20,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  smallActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Live Feed
  feedList: {
    gap: 10,
  },
  feedRow: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  feedRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeBoxText: {
    fontSize: 11,
    fontWeight: '800',
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: 13,
    fontWeight: '800',
  },
  stageLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  stageLocationText: {
    fontSize: 10,
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 14,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionLinkText: {
    fontSize: 10,
    fontWeight: '600',
  },
  viewAllFooter: {
    alignItems: 'center',
    paddingTop: 4,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Progress Bars (Middle Col)
  metricCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metricCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  barsGroup: {
    gap: 14,
  },
  barItem: {
    gap: 6,
  },
  barLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barTitleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  barValueText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Spotlight Card
  spotlightCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  spotlightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spotlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  spotlightBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  spotlightTime: {
    fontSize: 13,
    fontWeight: '800',
  },
  spotlightArtist: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  spotlightStage: {
    fontSize: 12,
    fontWeight: '500',
  },
  spotlightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  spotlightBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Stages Stack
  stagesStack: {
    gap: 10,
  },
  stageCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  stageCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stageIndexBadge: {
    width: 22,
    height: 22,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageIndexText: {
    fontSize: 10,
    fontWeight: '800',
  },
  stageTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  stageCountChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stageCountChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  stageNextText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Programación (Events view)
  eventsContainer: {
    gap: 16,
  },
  filterBar: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  filterBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterBarTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPillItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  filterPillItemText: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  eventDetailCard: {
    flex: 1,
    minWidth: 280,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  eventCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  timeTagText: {
    fontSize: 12,
    fontWeight: '800',
  },
  eventArtistTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eventMetaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  eventActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  smallBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  smallBtnOutlineText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  emptyResetBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  emptyResetBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Form View
  formContainer: {
    maxWidth: 620,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    gap: 18,
    alignSelf: 'center',
  },
  formTopInfo: {
    gap: 4,
  },
  formMainHeading: {
    fontSize: 18,
    fontWeight: '900',
  },
  formSubText: {
    fontSize: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  formBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Drawer Navigation (Mobile Overlay)
  drawerBackdrop: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdropPress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  drawerPanel: {
    width: 290,
    height: '100%',
    borderRightWidth: 1,
    padding: 20,
    gap: 16,
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 4, height: 0 },
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  drawerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerOperatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  drawerNavList: {
    gap: 6,
  },
  drawerNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  drawerNavItemActive: {
    borderWidth: 1,
  },
  drawerNavText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  drawerBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  drawerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  drawerSection: {
    gap: 8,
    paddingTop: 8,
  },
  drawerSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  drawerStageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  drawerStageName: {
    fontSize: 12,
    fontWeight: '600',
  },
  drawerFooter: {
    marginTop: 'auto',
    paddingTop: 14,
    borderTopWidth: 1,
  },
  drawerThemeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  drawerThemeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
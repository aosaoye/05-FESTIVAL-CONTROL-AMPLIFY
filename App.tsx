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
} from 'react-native';
import { initialEvents, FestivalEvent, EventStatus } from './src/data';
import { themes, ThemeMode, ThemeColors } from './src/theme';

type Page = 'dashboard' | 'events' | 'form';
const stages = ['MAIN STAGE', 'GARDEN', 'WAREHOUSE', 'RIVER STAGE'] as const;
const statuses: EventStatus[] = ['CONFIRMED', 'DELAYED', 'CANCELLED'];

export default function App() {
  const { width } = useWindowDimensions();
  const wide = width > 960;

  // App State
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [page, setPage] = useState<Page>('dashboard');
  const [events, setEvents] = useState<FestivalEvent[]>(initialEvents);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('TODOS');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formArtist, setFormArtist] = useState('');
  const [formSpace, setFormSpace] = useState<string>(stages[0]);
  const [formTime, setFormTime] = useState('21:45');
  const [formStatus, setFormStatus] = useState<EventStatus>('CONFIRMED');
  const [notice, setNotice] = useState('');

  const t: ThemeColors = themes[themeMode];

  // Stats
  const confirmed = useMemo(() => events.filter(e => e.status === 'CONFIRMED').length, [events]);
  const delayed = useMemo(() => events.filter(e => e.status === 'DELAYED').length, [events]);
  const cancelled = useMemo(() => events.filter(e => e.status === 'CANCELLED').length, [events]);

  // Next upcoming event for Hero card
  const nextEvent = useMemo(() => events.find(e => e.status === 'CONFIRMED') || events[0], [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchStage = stageFilter === 'TODOS' || e.space === stageFilter;
      const query = search.trim().toLowerCase();
      const matchSearch =
        !query ||
        e.artist.toLowerCase().includes(query) ||
        e.id.toLowerCase().includes(query) ||
        e.space.toLowerCase().includes(query);
      return matchStage && matchSearch;
    });
  }, [events, search, stageFilter]);

  // Handlers
  const openNew = () => {
    setEditingId(null);
    setFormArtist('');
    setFormSpace(stages[0]);
    setFormTime('21:45');
    setFormStatus('CONFIRMED');
    setNotice('');
    setPage('form');
  };

  const openEdit = (item: FestivalEvent) => {
    setEditingId(item.id);
    setFormArtist(item.artist);
    setFormSpace(item.space);
    setFormTime(item.time);
    setFormStatus(item.status);
    setNotice('');
    setPage('form');
  };

  const handleSave = () => {
    if (!formArtist.trim() || !/^([01]\d|2[0-3]):[0-5]\d$/.test(formTime)) {
      setNotice('Introduce un nombre de artista y hora válida (HH:MM).');
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
      setNotice(`"${formArtist.trim().toUpperCase()}" actualizado.`);
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
      setNotice(`"${formArtist.trim().toUpperCase()}" añadido.`);
    }
    setPage('events');
  };

  const handleCycleStatus = (id: string) => {
    setEvents(prev =>
      prev.map(e => {
        if (e.id !== id) return e;
        const nextStatus: EventStatus =
          e.status === 'CONFIRMED'
            ? 'DELAYED'
            : e.status === 'DELAYED'
            ? 'CANCELLED'
            : 'CONFIRMED';
        return { ...e, status: nextStatus };
      })
    );
  };

  const handleDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setNotice('Evento eliminado.');
  };

  const toggleTheme = () => {
    setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Helper for Status Badge styles
  const getStatusBadge = (status: EventStatus) => {
    if (status === 'CONFIRMED') {
      return {
        bg: t.statGreenBg,
        border: t.statGreenBorder,
        text: t.statGreenText,
        dot: t.statGreenText,
        label: 'CONFIRMADO',
      };
    }
    if (status === 'DELAYED') {
      return {
        bg: t.statAmberBg,
        border: t.statAmberBorder,
        text: t.statAmberText,
        dot: t.statAmberText,
        label: 'RETRASADO',
      };
    }
    return {
      bg: t.statRedBg,
      border: t.statRedBorder,
      text: t.statRedText,
      dot: t.statRedText,
      label: 'CANCELADO',
    };
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.bg }]}>
      <View style={[styles.shell, wide && styles.shellWide]}>
        {/* ===================== SIDEBAR ===================== */}
        <View style={[wide ? styles.sidebar : styles.mobileNav, { backgroundColor: t.sidebarBg, borderColor: t.border }]}>
          {/* Logo / Brand */}
          <View style={styles.brandRow}>
            <View style={[styles.brandIcon, { backgroundColor: t.heroBg, borderColor: t.border }]}>
              <Text style={{ fontSize: 16 }}>⚡</Text>
            </View>
            <View>
              <Text style={[styles.brandTitle, { color: t.text }]}>FestOps</Text>
              <Text style={[styles.brandSub, { color: t.textSub }]}>FESTIVAL CONTROL</Text>
            </View>
          </View>

          {/* User Profile (Desktop only) */}
          {wide && (
            <View style={[styles.userCard, { backgroundColor: t.cardElevated, borderColor: t.borderSubtle }]}>
              <View style={[styles.avatar, { backgroundColor: t.heroBg, borderColor: t.border }]}>
                <Text style={{ fontSize: 18 }}>🎧</Text>
              </View>
              <Text style={[styles.userName, { color: t.text }]}>Operador Central</Text>
              <Text style={[styles.userRole, { color: t.textSub }]}>Live Operations · ZGZ</Text>
            </View>
          )}

          {/* Navigation Items */}
          <View style={wide ? styles.navGroup : styles.mobileNavGroup}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPage('dashboard')}
              style={[
                styles.navBtn,
                page === 'dashboard' && { backgroundColor: t.actionBg, borderColor: t.border },
              ]}
            >
              <Text style={{ fontSize: 14, marginRight: 8 }}>📊</Text>
              <Text
                style={[
                  styles.navBtnText,
                  { color: page === 'dashboard' ? t.text : t.textMuted },
                  page === 'dashboard' && { fontWeight: '700' },
                ]}
              >
                Dashboard
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setPage('events')}
              style={[
                styles.navBtn,
                page === 'events' && { backgroundColor: t.actionBg, borderColor: t.border },
              ]}
            >
              <Text style={{ fontSize: 14, marginRight: 8 }}>🎵</Text>
              <Text
                style={[
                  styles.navBtnText,
                  { color: page === 'events' ? t.text : t.textMuted },
                  page === 'events' && { fontWeight: '700' },
                ]}
              >
                Programación
              </Text>
              <View style={[styles.countBadge, { backgroundColor: t.border }]}>
                <Text style={[styles.countText, { color: t.text }]}>{events.length}</Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={openNew}
              style={[
                styles.navBtn,
                page === 'form' && !editingId && { backgroundColor: t.actionBg, borderColor: t.border },
              ]}
            >
              <Text style={{ fontSize: 14, marginRight: 8 }}>➕</Text>
              <Text
                style={[
                  styles.navBtnText,
                  { color: page === 'form' ? t.text : t.textMuted },
                  page === 'form' && { fontWeight: '700' },
                ]}
              >
                Nuevo Evento
              </Text>
            </Pressable>
          </View>

          {/* Sidebar Footer: Theme Toggle & Status */}
          {wide && (
            <View style={[styles.sidebarFooter, { borderTopColor: t.borderSubtle }]}>
              <Pressable
                accessibilityRole="button"
                onPress={toggleTheme}
                style={[styles.themeToggle, { backgroundColor: t.cardElevated, borderColor: t.border }]}
              >
                <Text style={[styles.themeLabel, { color: t.textMuted }]}>
                  {themeMode === 'dark' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
                </Text>
                <View
                  style={[
                    styles.toggleSwitch,
                    { backgroundColor: themeMode === 'dark' ? t.border : '#E2E8F0' },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleKnob,
                      {
                        backgroundColor: t.text,
                        alignSelf: themeMode === 'dark' ? 'flex-end' : 'flex-start',
                      },
                    ]}
                  />
                </View>
              </Pressable>

              <View style={styles.liveIndicatorRow}>
                <View style={[styles.liveDot, { backgroundColor: t.statGreenText }]} />
                <Text style={[styles.liveText, { color: t.textSub }]}>LIVE DEMO · EXPO WEB</Text>
              </View>
            </View>
          )}
        </View>

        {/* ===================== MAIN CONTENT AREA ===================== */}
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={[styles.mainContent, { backgroundColor: t.bg }]}
        >
          {/* Top Header Bar */}
          <View style={styles.topHeader}>
            <View>
              <Text style={[styles.greeting, { color: t.text }]}>Hola, Operador 👋</Text>
              <Text style={[styles.greetingSub, { color: t.textSub }]}>
                Festival Zaragoza 2026 · Control en directo
              </Text>
            </View>

            {/* Quick theme toggle on mobile or top bar */}
            {!wide && (
              <Pressable
                onPress={toggleTheme}
                style={[styles.mobileThemeBtn, { backgroundColor: t.card, borderColor: t.border }]}
              >
                <Text style={{ fontSize: 13, color: t.text }}>
                  {themeMode === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Feedback notice if any */}
          {!!notice && (
            <View style={[styles.alertBanner, { backgroundColor: t.statGreenBg, borderColor: t.statGreenBorder }]}>
              <Text style={[styles.alertText, { color: t.statGreenText }]}>✔ {notice}</Text>
            </View>
          )}

          {/* ===================== PAGE: DASHBOARD ===================== */}
          {page === 'dashboard' && (
            <View style={styles.pageContainer}>
              {/* Central Hero Card ("My Card" aesthetic from reference) */}
              <View style={[styles.heroCard, { backgroundColor: t.heroBg, borderColor: t.heroBorder }]}>
                <View style={styles.heroTopRow}>
                  <View style={styles.heroTagBadge}>
                    <Text style={styles.heroTagText}>ESCENARIO PRINCIPAL</Text>
                  </View>
                  <View style={styles.heroLiveBadge}>
                    <View style={[styles.liveDot, { backgroundColor: '#34D399' }]} />
                    <Text style={styles.heroLiveText}>EN VIVO</Text>
                  </View>
                </View>

                <View style={styles.heroBody}>
                  <Text style={[styles.heroTitle, { color: t.heroText }]}>
                    {nextEvent ? nextEvent.artist : 'THE NIGHT IS YOURS'}
                  </Text>
                  <Text style={[styles.heroTime, { color: t.heroSub }]}>
                    {nextEvent ? `${nextEvent.time} · ${nextEvent.space}` : 'Zaragoza Live Festival 2026'}
                  </Text>
                </View>

                <View style={styles.heroActionsRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={openNew}
                    style={styles.heroBtnPrimary}
                  >
                    <Text style={styles.heroBtnPrimaryText}>＋ Nuevo Evento</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setPage('events')}
                    style={styles.heroBtnSecondary}
                  >
                    <Text style={styles.heroBtnSecondaryText}>Ver Programación</Text>
                  </Pressable>
                </View>
              </View>

              {/* Financial Record Style -> 3 KPI Summary Cards */}
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: t.text }]}>Estado de Operaciones</Text>
                <Text style={[styles.sectionSub, { color: t.textSub }]}>Tiempo real</Text>
              </View>

              <View style={[styles.statsRow, wide && styles.statsRowWide]}>
                {/* Stat 1: Confirmados */}
                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: t.statGreenBg, borderColor: t.statGreenBorder },
                  ]}
                >
                  <View style={styles.statHeader}>
                    <Text style={[styles.statLabel, { color: t.statGreenText }]}>CONFIRMADOS</Text>
                    <Text style={{ fontSize: 13 }}>🟢</Text>
                  </View>
                  <Text style={[styles.statValue, { color: t.statGreenText }]}>
                    {String(confirmed).padStart(2, '0')}
                  </Text>
                  <Text style={[styles.statFooter, { color: t.statGreenText }]}>
                    ● En horario previsto
                  </Text>
                </View>

                {/* Stat 2: Retrasados */}
                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: t.statAmberBg, borderColor: t.statAmberBorder },
                  ]}
                >
                  <View style={styles.statHeader}>
                    <Text style={[styles.statLabel, { color: t.statAmberText }]}>RETRASADOS</Text>
                    <Text style={{ fontSize: 13 }}>⚠️</Text>
                  </View>
                  <Text style={[styles.statValue, { color: t.statAmberText }]}>
                    {String(delayed).padStart(2, '0')}
                  </Text>
                  <Text style={[styles.statFooter, { color: t.statAmberText }]}>
                    ▲ Monitoreando horario
                  </Text>
                </View>

                {/* Stat 3: Total Programados */}
                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: t.statBlueBg, borderColor: t.statBlueBorder },
                  ]}
                >
                  <View style={styles.statHeader}>
                    <Text style={[styles.statLabel, { color: t.statBlueText }]}>TOTAL EVENTOS</Text>
                    <Text style={{ fontSize: 13 }}>🎵</Text>
                  </View>
                  <Text style={[styles.statValue, { color: t.statBlueText }]}>
                    {String(events.length).padStart(2, '0')}
                  </Text>
                  <Text style={[styles.statFooter, { color: t.statBlueText }]}>
                    4 escenarios activos
                  </Text>
                </View>
              </View>

              {/* Two-Column Area: Escenarios + Próximas Actuaciones (Transactions style) */}
              <View style={[styles.splitGrid, wide && styles.splitGridWide]}>
                {/* Left: Escenarios Activos */}
                <View style={[styles.splitCol, { backgroundColor: t.card, borderColor: t.border }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: t.text }]}>Escenarios del Festival</Text>
                    <Text style={[styles.cardSubtitle, { color: t.textSub }]}>4 Ubicaciones</Text>
                  </View>

                  <View style={styles.stagesList}>
                    {stages.map((st, i) => {
                      const countOnStage = events.filter(e => e.space === st).length;
                      const nextOnStage = events.find(e => e.space === st);
                      return (
                        <Pressable
                          key={st}
                          onPress={() => {
                            setStageFilter(st);
                            setPage('events');
                          }}
                          style={[styles.stageItem, { borderColor: t.borderSubtle, backgroundColor: t.cardElevated }]}
                        >
                          <View style={styles.stageItemLeft}>
                            <View style={[styles.stageBadgeIcon, { backgroundColor: t.actionBg }]}>
                              <Text style={[styles.stageNumberText, { color: t.text }]}>{`0${i + 1}`}</Text>
                            </View>
                            <View>
                              <Text style={[styles.stageName, { color: t.text }]}>{st}</Text>
                              <Text style={[styles.stageSub, { color: t.textSub }]}>
                                {nextOnStage ? `Próximo: ${nextOnStage.artist} (${nextOnStage.time})` : 'Sin eventos'}
                              </Text>
                            </View>
                          </View>
                          <View style={[styles.stageCountPill, { backgroundColor: t.badgeBg }]}>
                            <Text style={[styles.stageCountText, { color: t.text }]}>{countOnStage} acts</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Right: Próximas Actuaciones (Transaction Feed style) */}
                <View style={[styles.splitCol, { backgroundColor: t.card, borderColor: t.border }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: t.text }]}>Timeline de Conciertos</Text>
                    <Pressable onPress={() => setPage('events')}>
                      <Text style={[styles.cardLink, { color: t.primary }]}>Ver Todos →</Text>
                    </Pressable>
                  </View>

                  <View style={styles.eventsFeedList}>
                    {events.slice(0, 4).map(e => {
                      const badge = getStatusBadge(e.status);
                      return (
                        <View
                          key={e.id}
                          style={[styles.feedItem, { borderColor: t.borderSubtle, backgroundColor: t.cardElevated }]}
                        >
                          <View style={styles.feedItemHeader}>
                            <View style={[styles.timePill, { backgroundColor: t.actionBg }]}>
                              <Text style={[styles.timeText, { color: t.text }]}>{e.time}</Text>
                            </View>
                            <Pressable
                              onPress={() => handleCycleStatus(e.id)}
                              style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}
                            >
                              <View style={[styles.statusDot, { backgroundColor: badge.dot }]} />
                              <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
                            </Pressable>
                          </View>

                          <Text style={[styles.feedArtist, { color: t.text }]}>{e.artist}</Text>
                          <Text style={[styles.feedSpace, { color: t.textSub }]}>
                            {e.space} · {e.id}
                          </Text>

                          <View style={[styles.feedActions, { borderTopColor: t.borderSubtle }]}>
                            <Pressable onPress={() => openEdit(e)} style={styles.actionBtn}>
                              <Text style={[styles.actionBtnText, { color: t.text }]}>Editar</Text>
                            </Pressable>
                            <Pressable onPress={() => handleCycleStatus(e.id)} style={styles.actionBtn}>
                              <Text style={[styles.actionBtnText, { color: t.primary }]}>Cambiar Estado</Text>
                            </Pressable>
                            <Pressable onPress={() => handleDelete(e.id)} style={styles.actionBtn}>
                              <Text style={[styles.actionBtnText, { color: t.statRedText }]}>Eliminar</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ===================== PAGE: PROGRAMACIÓN (EVENTS) ===================== */}
          {page === 'events' && (
            <View style={styles.pageContainer}>
              <View style={[styles.eventsHeaderCard, { backgroundColor: t.card, borderColor: t.border }]}>
                <View style={styles.eventsHeaderTop}>
                  <View>
                    <Text style={[styles.sectionTitle, { color: t.text }]}>Programación Completa</Text>
                    <Text style={[styles.sectionSub, { color: t.textSub }]}>
                      {filteredEvents.length} conciertos encontrados
                    </Text>
                  </View>
                  <Pressable accessibilityRole="button" onPress={openNew} style={styles.primaryPillBtn}>
                    <Text style={styles.primaryPillBtnText}>＋ Nuevo Evento</Text>
                  </Pressable>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchBox, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
                  <Text style={{ marginRight: 8, fontSize: 14 }}>🔍</Text>
                  <TextInput
                    accessibilityLabel="Buscar artista o ID"
                    placeholder="Buscar artista, escenario o ID..."
                    placeholderTextColor={t.textSub}
                    style={[styles.searchInput, { color: t.text }]}
                    value={search}
                    onChangeText={setSearch}
                  />
                  {!!search && (
                    <Pressable onPress={() => setSearch('')}>
                      <Text style={{ color: t.textSub, fontSize: 13 }}>✕</Text>
                    </Pressable>
                  )}
                </View>

                {/* Stage Filter Pills */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterPillsContainer}
                >
                  {['TODOS', ...stages].map(st => {
                    const isActive = stageFilter === st;
                    return (
                      <Pressable
                        key={st}
                        onPress={() => setStageFilter(st)}
                        style={[
                          styles.filterPill,
                          { backgroundColor: isActive ? t.heroBg : t.cardElevated, borderColor: isActive ? t.primary : t.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            { color: isActive ? '#FFFFFF' : t.textMuted },
                            isActive && { fontWeight: '700' },
                          ]}
                        >
                          {st}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Event Cards Grid */}
              <View style={styles.eventsList}>
                {filteredEvents.length === 0 ? (
                  <View style={[styles.emptyStateCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <Text style={{ fontSize: 32, marginBottom: 12 }}>🔎</Text>
                    <Text style={[styles.emptyTitle, { color: t.text }]}>No se encontraron eventos</Text>
                    <Text style={[styles.emptySub, { color: t.textSub }]}>
                      Prueba con otro término de búsqueda o selecciona otro escenario.
                    </Text>
                    <Pressable
                      onPress={() => {
                        setSearch('');
                        setStageFilter('TODOS');
                      }}
                      style={[styles.resetBtn, { backgroundColor: t.actionBg }]}
                    >
                      <Text style={[styles.resetBtnText, { color: t.text }]}>Restablecer Filtros</Text>
                    </Pressable>
                  </View>
                ) : (
                  filteredEvents.map(e => {
                    const badge = getStatusBadge(e.status);
                    return (
                      <View
                        key={e.id}
                        style={[styles.fullEventCard, { backgroundColor: t.card, borderColor: t.border }]}
                      >
                        <View style={styles.fullCardHeader}>
                          <View style={styles.fullCardHeaderLeft}>
                            <View style={[styles.timeBadgeLarge, { backgroundColor: t.actionBg }]}>
                              <Text style={[styles.timeBadgeLargeText, { color: t.text }]}>{e.time}</Text>
                            </View>
                            <View>
                              <Text style={[styles.fullArtist, { color: t.text }]}>{e.artist}</Text>
                              <Text style={[styles.fullSpace, { color: t.textSub }]}>
                                {e.space} · {e.id}
                              </Text>
                            </View>
                          </View>

                          <Pressable
                            onPress={() => handleCycleStatus(e.id)}
                            style={[
                              styles.statusBadge,
                              { backgroundColor: badge.bg, borderColor: badge.border },
                            ]}
                          >
                            <View style={[styles.statusDot, { backgroundColor: badge.dot }]} />
                            <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
                          </Pressable>
                        </View>

                        <View style={[styles.fullCardFooter, { borderTopColor: t.borderSubtle }]}>
                          <Pressable
                            onPress={() => openEdit(e)}
                            style={[styles.smallBtn, { backgroundColor: t.cardElevated, borderColor: t.border }]}
                          >
                            <Text style={[styles.smallBtnText, { color: t.text }]}>✏️ Editar</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleCycleStatus(e.id)}
                            style={[styles.smallBtn, { backgroundColor: t.cardElevated, borderColor: t.border }]}
                          >
                            <Text style={[styles.smallBtnText, { color: t.primary }]}>🔄 Cambiar Estado</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleDelete(e.id)}
                            style={[styles.smallBtn, { backgroundColor: t.cardElevated, borderColor: t.border }]}
                          >
                            <Text style={[styles.smallBtnText, { color: t.statRedText }]}>🗑️ Eliminar</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          )}

          {/* ===================== PAGE: FORM (CREAR / EDITAR) ===================== */}
          {page === 'form' && (
            <View style={styles.pageContainer}>
              <View style={[styles.formCard, { backgroundColor: t.card, borderColor: t.border }]}>
                <View style={styles.formHeader}>
                  <Text style={[styles.formTitle, { color: t.text }]}>
                    {editingId ? 'Editar Concierto' : 'Crear Nuevo Concierto'}
                  </Text>
                  <Text style={[styles.formSub, { color: t.textSub }]}>
                    {editingId
                      ? `Modificando ID: ${editingId}`
                      : 'Introduce la información del artista y su horario'}
                  </Text>
                </View>

                {/* Field: Artista */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: t.textMuted }]}>NOMBRE DEL ARTISTA *</Text>
                  <TextInput
                    accessibilityLabel="Nombre del artista"
                    placeholder="Ej. THE CHEMICAL BROTHERS"
                    placeholderTextColor={t.textSub}
                    style={[styles.formInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text }]}
                    value={formArtist}
                    onChangeText={setFormArtist}
                  />
                </View>

                {/* Field: Escenario */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: t.textMuted }]}>ESCENARIO *</Text>
                  <View style={styles.choicesRow}>
                    {stages.map(st => {
                      const selected = formSpace === st;
                      return (
                        <Pressable
                          key={st}
                          onPress={() => setFormSpace(st)}
                          style={[
                            styles.choicePill,
                            {
                              backgroundColor: selected ? t.heroBg : t.cardElevated,
                              borderColor: selected ? t.primary : t.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.choicePillText,
                              { color: selected ? '#FFFFFF' : t.text },
                              selected && { fontWeight: '700' },
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
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: t.textMuted }]}>HORA PROGRAMADA (HH:MM) *</Text>
                  <TextInput
                    accessibilityLabel="Hora en formato HH:MM"
                    placeholder="22:30"
                    placeholderTextColor={t.textSub}
                    style={[styles.formInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text }]}
                    value={formTime}
                    onChangeText={setFormTime}
                  />
                </View>

                {/* Field: Estado */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: t.textMuted }]}>ESTADO INICIAL *</Text>
                  <View style={styles.choicesRow}>
                    {statuses.map(st => {
                      const selected = formStatus === st;
                      const badge = getStatusBadge(st);
                      return (
                        <Pressable
                          key={st}
                          onPress={() => setFormStatus(st)}
                          style={[
                            styles.choicePill,
                            {
                              backgroundColor: selected ? badge.bg : t.cardElevated,
                              borderColor: selected ? badge.border : t.border,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: selected ? badge.dot : t.textSub },
                            ]}
                          />
                          <Text
                            style={[
                              styles.choicePillText,
                              { color: selected ? badge.text : t.textMuted },
                              selected && { fontWeight: '700' },
                            ]}
                          >
                            {st}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.formActionsRow}>
                  <Pressable accessibilityRole="button" onPress={handleSave} style={styles.primaryPillBtn}>
                    <Text style={styles.primaryPillBtnText}>
                      {editingId ? 'Guardar Cambios' : 'Crear Evento'}
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
            </View>
          )}

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: t.borderSubtle }]}>
            <Text style={[styles.footerText, { color: t.textSub }]}>
              FESTIVAL CONTROL · LIVE OPERATIONS DASHBOARD · EXPO + REACT NATIVE
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  shell: {
    flex: 1,
    flexDirection: 'column',
  },
  shellWide: {
    flexDirection: 'row',
  },

  // Sidebar (Desktop)
  sidebar: {
    width: 250,
    borderRightWidth: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  // Mobile Nav (Phones / Small screens)
  mobileNav: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  userCard: {
    marginVertical: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
  },
  userRole: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  navGroup: {
    gap: 8,
    flex: 1,
  },
  mobileNavGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sidebarFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleSwitch: {
    width: 38,
    height: 20,
    borderRadius: 10,
    padding: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Main Content
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    padding: 24,
    paddingBottom: 60,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  greetingSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  mobileThemeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  alertBanner: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pageContainer: {
    gap: 24,
  },

  // Hero Card ("My Card" aesthetic)
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 26,
    gap: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTagBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  heroTagText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52,211,153,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroLiveText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroBody: {
    gap: 6,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  heroActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroBtnPrimary: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  heroBtnPrimaryText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  heroBtnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  heroBtnSecondaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // KPI Stats Cards (Financial Record style)
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'column',
    gap: 14,
  },
  statsRowWide: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statFooter: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Split Grid (Escenarios + Timeline)
  splitGrid: {
    gap: 20,
  },
  splitGridWide: {
    flexDirection: 'row',
  },
  splitCol: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardLink: {
    fontSize: 12,
    fontWeight: '800',
  },
  stagesList: {
    gap: 10,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  stageItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  stageBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageNumberText: {
    fontSize: 12,
    fontWeight: '900',
  },
  stageName: {
    fontSize: 13,
    fontWeight: '800',
  },
  stageSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  stageCountPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stageCountText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Feed / Transactions style list
  eventsFeedList: {
    gap: 12,
  },
  feedItem: {
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  feedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  feedArtist: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  feedSpace: {
    fontSize: 11,
    fontWeight: '600',
  },
  feedActions: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 6,
  },
  actionBtn: {
    paddingVertical: 2,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Programación (Events view)
  eventsHeaderCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  eventsHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  primaryPillBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  primaryPillBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  filterPillsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventsList: {
    gap: 12,
  },
  fullEventCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  fullCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  fullCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  timeBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  timeBadgeLargeText: {
    fontSize: 15,
    fontWeight: '900',
  },
  fullArtist: {
    fontSize: 18,
    fontWeight: '900',
  },
  fullSpace: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  fullCardFooter: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
  },
  smallBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyStateCard: {
    padding: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 400,
  },
  resetBtn: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Form View
  formCard: {
    padding: 24,
    borderRadius: 22,
    borderWidth: 1,
    gap: 20,
    maxWidth: 700,
    width: '100%',
    alignSelf: 'center',
  },
  formHeader: {
    gap: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  formSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  formGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  choicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  choicePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Footer
  footer: {
    marginTop: 30,
    paddingTop: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { tasksApi } from '../services/api';
import { colors, spacing, radius, typography } from '../theme/colors';

interface Subtask {
  _id: string;
  title: string;
  completed: boolean;
}

interface Task {
  _id: string;
  title: string;
  completed: boolean;
  dueAt?: string;
  estimateMins?: number;
  dreadScore?: number;
  aiPriority?: string;
  subtasks?: Subtask[];
}

const PRIORITY_COLORS: Record<string, string> = {
  High: colors.red,
  Medium: colors.amber,
  Low: colors.green,
};

export default function TasksScreen() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showBrainDump, setShowBrainDump] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDue, setNewDue] = useState('');
  const [newMins, setNewMins] = useState('');
  const [brainDumpText, setBrainDumpText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending');

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; dueAt?: string; estimateMins?: number }) =>
      tasksApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setShowAdd(false);
      setNewTitle('');
      setNewDue('');
      setNewMins('');
    },
    onError: () => Alert.alert('Error', 'Failed to create task.'),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => tasksApi.complete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const brainDumpMutation = useMutation({
    mutationFn: (text: string) => tasksApi.brainDump(text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setShowBrainDump(false);
      setBrainDumpText('');
      Alert.alert('Done!', 'Your brain dump has been parsed into tasks.');
    },
    onError: () => Alert.alert('Error', 'Failed to parse brain dump.'),
  });

  const chunkMutation = useMutation({
    mutationFn: (id: string) => tasksApi.autoChunk(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError: () => Alert.alert('Error', 'Failed to chunk task.'),
  });

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    createMutation.mutate({
      title: newTitle.trim(),
      dueAt: newDue.trim() || undefined,
      estimateMins: newMins ? parseInt(newMins) : undefined,
    });
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Task', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const filtered = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const renderTask = ({ item }: { item: Task }) => {
    const isExpanded = expandedId === item._id;
    const pc = item.aiPriority ? PRIORITY_COLORS[item.aiPriority] : colors.textMuted;

    return (
      <View style={[styles.taskCard, item.completed && styles.taskDone]}>
        <View style={styles.taskRow}>
          <TouchableOpacity
            style={[styles.checkbox, item.completed && styles.checkboxDone]}
            onPress={() => !item.completed && completeMutation.mutate(item._id)}
          >
            {item.completed && <Ionicons name="checkmark" size={14} color={colors.white} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.taskBody}
            onPress={() => setExpandedId(isExpanded ? null : item._id)}
          >
            <Text style={[styles.taskTitle, item.completed && styles.taskTitleDone]}>
              {item.title}
            </Text>
            <View style={styles.taskMeta}>
              {item.estimateMins && (
                <View style={styles.chip}>
                  <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.chipText}>{item.estimateMins}m</Text>
                </View>
              )}
              {item.aiPriority && (
                <View style={[styles.chip, { borderColor: pc + '60' }]}>
                  <Text style={[styles.chipText, { color: pc }]}>{item.aiPriority}</Text>
                </View>
              )}
              {item.dueAt && (
                <View style={styles.chip}>
                  <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.chipText}>
                    {new Date(item.dueAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item._id, item.title)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.expanded}>
            {/* Subtasks */}
            {item.subtasks && item.subtasks.length > 0 && (
              <View style={styles.subtaskList}>
                {item.subtasks.map((st) => (
                  <View key={st._id} style={styles.subtaskRow}>
                    <Ionicons
                      name={st.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={st.completed ? colors.green : colors.textMuted}
                    />
                    <Text style={[styles.subtaskText, st.completed && styles.subtaskDone]}>
                      {st.title}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Chunk Button */}
            {!item.completed && (
              <TouchableOpacity
                style={styles.chunkBtn}
                onPress={() => chunkMutation.mutate(item._id)}
                disabled={chunkMutation.isPending}
              >
                {chunkMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.violet} />
                ) : (
                  <>
                    <Ionicons name="cut-outline" size={14} color={colors.violet} />
                    <Text style={styles.chunkText}>AI Chunk this task</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.brainDumpBtn} onPress={() => setShowBrainDump(true)}>
            <Ionicons name="create-outline" size={16} color={colors.violetLight} />
            <Text style={styles.brainDumpBtnText}>Brain Dump</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {(['pending', 'all', 'done'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'pending' ? 'Pending' : f === 'done' ? 'Done' : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.violetLight} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t._id}
          renderItem={renderTask}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {filter === 'pending' ? '🎉 All caught up!' : 'No tasks here.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Add Task Modal */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Task</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Task title..."
              placeholderTextColor={colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Due date (YYYY-MM-DD, optional)"
              placeholderTextColor={colors.textMuted}
              value={newDue}
              onChangeText={setNewDue}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Estimated minutes (optional)"
              placeholderTextColor={colors.textMuted}
              value={newMins}
              onChangeText={setNewMins}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, createMutation.isPending && styles.btnDisabled]}
                onPress={handleAdd}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.confirmText}>Add Task</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Brain Dump Modal */}
      <Modal
        visible={showBrainDump}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBrainDump(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalSheet, styles.brainDumpSheet]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>🧠 Brain Dump</Text>
            <Text style={styles.modalSubtitle}>
              Write everything on your mind. AI will turn it into tasks.
            </Text>

            <TextInput
              style={[styles.modalInput, styles.brainDumpInput]}
              placeholder="Just type anything... emails to send, calls to make, chores, ideas..."
              placeholderTextColor={colors.textMuted}
              value={brainDumpText}
              onChangeText={setBrainDumpText}
              multiline
              autoFocus
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBrainDump(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, brainDumpMutation.isPending && styles.btnDisabled]}
                onPress={() => {
                  if (!brainDumpText.trim()) return;
                  brainDumpMutation.mutate(brainDumpText.trim());
                }}
                disabled={brainDumpMutation.isPending}
              >
                {brainDumpMutation.isPending ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.confirmText}>Parse with AI</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { ...typography.bodySmall, textAlign: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.h2 },
  headerActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  brainDumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.violetLight + '60',
    backgroundColor: colors.violet + '20',
  },
  brainDumpBtnText: {
    color: colors.violetLight,
    fontSize: 13,
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.violet,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 38,
  },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },

  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  filterBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: colors.violet + '30',
    borderColor: colors.violetLight,
  },
  filterText: { ...typography.label, color: colors.textMuted },
  filterTextActive: { color: colors.violetLight },

  list: { padding: spacing.md, paddingTop: 0, gap: spacing.sm, paddingBottom: spacing.xxl },

  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  taskDone: { opacity: 0.55 },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxDone: { backgroundColor: colors.green, borderColor: colors.green },
  taskBody: { flex: 1, gap: spacing.xs },
  taskTitle: { ...typography.body, fontWeight: '600' },
  taskTitleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.card,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { ...typography.caption },
  deleteBtn: { padding: spacing.xs },

  expanded: { marginTop: spacing.sm, gap: spacing.sm },
  subtaskList: { gap: spacing.xs },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  subtaskText: { ...typography.bodySmall },
  subtaskDone: { textDecorationLine: 'line-through', color: colors.textMuted },

  chunkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.violet + '20',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.violet + '40',
  },
  chunkText: { ...typography.caption, color: colors.violetLight, fontWeight: '600' },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  brainDumpSheet: { maxHeight: '80%' },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: { ...typography.h3 },
  modalSubtitle: { ...typography.bodySmall, color: colors.textMuted, marginTop: -spacing.xs },
  modalInput: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
  },
  brainDumpInput: { minHeight: 120, maxHeight: 240 },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { ...typography.body, color: colors.textSecondary },
  confirmBtn: {
    flex: 2,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.violet,
    borderRadius: radius.md,
  },
  confirmText: { ...typography.body, color: colors.white, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});

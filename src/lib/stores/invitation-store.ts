import { writable, derived, get } from 'svelte/store';
import { t } from 'svelte-i18n';
import { generateCodes, getAllCodes, type InvitationCode } from '$lib/services/invitation-service';
import { createLogger } from '$lib/logger';

export type { InvitationCode } from '$lib/services/invitation-service';

const log = createLogger('invitation-store');

interface InvitationState {
  codes: InvitationCode[];
  loading: boolean;
  error: string | null;
}

function createInvitationStore() {
  const { subscribe, update } = writable<InvitationState>({
    codes: [],
    loading: false,
    error: null
  });

  return {
    subscribe,

    async load() {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const codes = getAllCodes();
        update(state => ({ ...state, codes, loading: false }));
      } catch (err) {
        log.error({ err }, 'Failed to load invitation codes');
        update(state => ({
          ...state,
          loading: false,
          error: get(t)('admin.loadFailed')
        }));
      }
    },

    async generate(count: number) {
      update(state => ({ ...state, error: null }));

      try {
        const newCodes = await generateCodes(count);
        log.info({ count: newCodes.length }, 'Generated invitation codes');
        // Reload all codes to get fresh state
        const codes = getAllCodes();
        update(state => ({ ...state, codes }));
        return newCodes;
      } catch (err) {
        log.error({ err }, 'Failed to generate invitation codes');
        update(state => ({
          ...state,
          error: get(t)('admin.generateFailed')
        }));
        throw err;
      }
    }
  };
}

export const invitationStore = createInvitationStore();

export const invitationCodes = derived(invitationStore, $state => $state.codes);
export const invitationLoading = derived(invitationStore, $state => $state.loading);
export const invitationError = derived(invitationStore, $state => $state.error);

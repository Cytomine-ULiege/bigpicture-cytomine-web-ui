/*
* Copyright (c) 2009-2022. Authors: see NOTICE file.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

import {Cytomine, User} from 'cytomine-client';

function getDefaultState() {
  return {
    user: null,
    expandedSidebar: true,
    increment: 0,
    shortTermToken: null
  };
}

export default {
  namespaced: true,

  state: getDefaultState(),

  mutations: {
    setUser(state, user) {
      state.user = user ? user.clone() : null;
    },
    setShortTermToken(state, value) {
      state.shortTermToken = value;
    },
    setAdminByNow(state, value) {
      state.user.adminByNow = value;
    },
    setExpandedSidebar(state, val) {
      state.expandedSidebar = val;
    },
    resetState(state) {
      Object.assign(state, getDefaultState());
    },
  },

  actions: {
    async fetchUser({commit}) {
      let user = await User.fetchCurrent();
      if(user.id) { // fetchCurrent() redirects to home page if user not authenticated => check that id is set
        commit('setUser', user);
      }
      else {
        commit('setUser', null);
      }
    },

    async updateUser({commit}, user) {
      await user.update();
      commit('setUser', user);
    },

    async regenerateKeys({state, commit}) {
      let user = state.user.clone();
      await user.regenerateKeys();
      commit('setUser', user);
    },

    async openAdminSession({commit}) {
      await Cytomine.instance.openAdminSession();
      commit('setAdminByNow', true);
    },
    async closeAdminSession({dispatch}) {
      await Cytomine.instance.closeAdminSession();
      await dispatch('fetchUser');
    },

    async login({dispatch, commit}, payload) {
      let {shortTermToken} = await Cytomine.instance.login(payload.username, payload.password, payload.rememberMe);
      commit('setShortTermToken', shortTermToken);
      await dispatch('fetchUser');
    }
  },

  getters: {
    currentShortTermToken: (state, _, rootState) => {
      let currentUser = rootState.currentUser || {};
      return currentUser.shortTermToken;
    },
  }

};

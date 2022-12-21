<!-- Copyright (c) 2009-2022. Authors: see NOTICE file.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.-->

<template>
<div>
  <h1>
    {{$t('information')}}
  </h1>
  <table class="table">
    <tbody>
      <tr v-if="currentUser.isDeveloper">
        <td><strong>{{$t('id')}}</strong></td>
        <td>{{image.id}}</td>
      </tr>
      <tr>
        <td><strong>{{$t('name')}}</strong></td>
        <td><image-name :image="image" showBothNames /></td>
      </tr>
      <tr v-if="hasGroup">
        <td><strong>{{$t('image-group')}}</strong></td>
        <td>{{imageGroupLink.groupName}}</td>
      </tr>
      <tr>
        <td><strong>{{$t('width')}}</strong></td>
        <td>{{image.width}} {{$t("pixels")}}</td>
      </tr>
      <tr>
        <td><strong>{{$t('height')}}</strong></td>
        <td>{{image.height}} {{$t("pixels")}}</td>
      </tr>
      <tr v-if="image.depth > 1">
        <td><strong>{{$t('image-depth')}}</strong>
        <td>{{$tc("count-slices", image.depth, {count: image.depth})}}</td>
      </tr>
      <tr v-if="image.duration > 1">
        <td><strong>{{$t('image-time')}}</strong></td>
        <td>{{$tc("count-frames", image.duration, {count: image.duration})}}</td>
      </tr>
      <tr v-if="image.channels > 1">
        <td><strong>{{$t('image-channels')}}</strong></td>
        <td>
          {{$tc("count-bands", image.apparentChannels, {count: image.apparentChannels})}}
          ({{image.channels}} x {{image.samplePerPixel}})
        </td>
      </tr>
      <tr>
        <td><strong>{{$t('resolution')}}</strong></td>
        <td v-if="image.physicalSizeX">{{image.physicalSizeX.toFixed(3)}} {{$t("um-per-pixel")}}</td>
        <td v-else>{{$t("unknown")}}</td>
      </tr>
      <tr v-if="image.depth > 1">
        <td><strong>{{$t('z-resolution')}}</strong></td>
        <td v-if="image.physicalSizeZ">{{image.physicalSizeZ.toFixed(3)}} {{$t("um-per-slice")}}</td>
        <td v-else>{{$t("unknown")}}</td>
      </tr>
      <tr v-if="image.duration > 1">
        <td><strong>{{$t('frame-rate')}}</strong></td>
        <td v-if="image.fps">{{image.fps.toFixed(3)}} {{$t("frame-per-second")}}</td>
        <td v-else>{{$t("unknown")}}</td>
      </tr>
      <tr>
        <td><strong>{{$t('magnification')}}</strong></td>
        <td v-if="image.magnification">{{image.magnification}}</td>
        <td v-else>{{$t('unknown')}}</td>
      </tr>
      <tr>
        <td><strong>{{$t('preset')}}</strong></td>
        <td>
          <b-field>
            <b-select :placeholder="$t('select-preset')" size="is-small" v-model="selectedPreset">
              <option :value="null">
                {{ $t('none') }}
              </option>
              <option v-for="user in availablePresets" :value="user" :key="user.id">
                {{ presetName(user) }}
              </option>
            </b-select>
          </b-field>
        </td>
      </tr>
      <tr>
        <td colspan="2" class="actions">
          <div class="buttons">
            <button class="button is-small" @click="savePreset()">{{$t('button-save-preset')}}</button>
            <button class="button is-small" @click="loadPreset()">{{$t('button-load-preset')}}</button>
          </div>
        </td>
      </tr>
      <tr>
        <td colspan="2" class="actions">
          <div class="buttons">
            <button v-if="canEdit" class="button is-small" @click="calibrationModal = true">
              {{$t('button-set-calibration')}}
            </button>
            <router-link :to="`/project/${image.project}/image/${image.id}/information`" class="button is-small">
              {{$t('button-more-info')}}
            </router-link>
            <a class="button is-small" :href="image.downloadURL" v-if="image.path">
              {{$t('button-download')}}
            </a>
          </div>
        </td>
      </tr>
      <tr>
        <td colspan="2" class="buttons-wrapper">
          <div class="buttons navigation has-addons">
            <button class="button is-small" @click="previousImage()" :disabled="isFirstImage">
              <i class="fas fa-angle-left fa-lg"></i> {{$t('button-previous-image')}}
            </button>
            <button class="button is-small" @click="nextImage()" :disabled="isLastImage">
              {{$t('button-next-image')}} <i class="fas fa-angle-right fa-lg"></i>
            </button>
          </div>
        </td>
      </tr>
      <tr v-if="hasGroup">
        <td colspan="2" class="buttons-wrapper">
          <div class="buttons navigation has-addons">
            <button class="button is-small" @click="previousImageInGroup()">
              <i class="fas fa-angle-left fa-lg"></i> {{$t('button-previous-image-in-group')}}
            </button>
            <button class="button is-small" @click="nextImageInGroup()">
              {{$t('button-next-image-in-group')}} <i class="fas fa-angle-right fa-lg"></i>
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>

  <calibration-modal
    :image="image"
    :active.sync="calibrationModal"
    @setResolution="setResolution"
  />
</div>
</template>

<script>
import {get} from '@/utils/store-helpers';
import {fullName} from '@/utils/user-utils.js';

import ImageName from '@/components/image/ImageName';
import CalibrationModal from '@/components/image/CalibrationModal';

import {Preset, PresetChannel, PresetCollection, PresetChannelCollection} from 'cytomine-client';

export default {
  name: 'information-panel',
  components: {
    ImageName,
    CalibrationModal
  },
  props: {
    index: String
  },
  data() {
    return {
      calibrationModal: false,
      isFirstImage: false,
      isLastImage: false,
      users: [],
      presets: [],
      presetChannels: {},
      selectedPreset: null,
    };
  },
  computed: {
    currentUser: get('currentUser/user'),
    project: get('currentProject/project'),
    viewerModule() {
      return this.$store.getters['currentProject/currentViewerModule'];
    },
    viewerWrapper() {
      return this.$store.getters['currentProject/currentViewer'];
    },
    imageModule() {
      return this.$store.getters['currentProject/imageModule'](this.index);
    },
    imageWrapper() {
      return this.viewerWrapper.images[this.index];
    },
    image() {
      return this.viewerWrapper.images[this.index].imageInstance;
    },
    hasGroup() {
      return this.viewerWrapper.images[this.index].imageGroupLink != null;
    },
    imageGroupLink() {
      return this.viewerWrapper.images[this.index].imageGroupLink;
    },
    canEdit() {
      return this.$store.getters['currentProject/canEditImage'](this.image);
    },
    isActiveImage() {
      return this.viewerWrapper.activeImage === this.index;
    },
    availablePresets() {
      let userIds = this.presets.map(preset => preset.user);
      return this.users.filter(user => userIds.includes(user.id));
    },
  },
  methods: {
    setResolution(resolution) {
      this.$store.dispatch(this.viewerModule + 'setImageResolution', {idImage: this.image.id, resolution});
      this.$eventBus.$emit('reloadAnnotations', {idImage: this.image.id}); // refresh the sources to update perimeter/area
    },
    async previousImage() {
      try {
        let prev = await this.image.fetchPrevious();
        if(!prev.id) {
          this.$notify({type: 'error', text: this.$t('notif-error-first-image')});
          this.isFirstImage = true;
        }
        else {
          let slice = await prev.fetchReferenceSlice();
          await this.$store.dispatch(this.imageModule + 'setImageInstance', {image: prev, slices: [slice]});
        }
      }
      catch(error) {
        console.log(error);
        this.$notify({type: 'error', text: this.$t('notif-error-fetch-previous-image')});
      }
    },
    async nextImage() {
      try {
        let next = await this.image.fetchNext();
        if(!next.id) {
          this.$notify({type: 'error', text: this.$t('notif-error-last-image')});
          this.isLastImage = true;
        }
        else {
          let slice = await next.fetchReferenceSlice();
          await this.$store.dispatch(this.imageModule + 'setImageInstance', {image: next, slices: [slice]});
        }
      }
      catch(error) {
        console.log(error);
        this.$notify({type: 'error', text: this.$t('notif-error-fetch-next-image')});
      }
    },
    async previousImageInGroup() {
      if (!this.hasGroup) {
        return;
      }

      try {
        let prev = await this.imageGroupLink.fetchPrevious();
        if(!prev.id) {
          this.$notify({type: 'error', text: this.$t('notif-error-first-image')});
        }
        else {
          let slice = await prev.fetchReferenceSlice();
          await this.$store.dispatch(this.imageModule + 'setImageInstance', {image: prev, slices: [slice]});
        }
      }
      catch(error) {
        console.log(error);
        this.$notify({type: 'error', text: this.$t('notif-error-fetch-previous-image')});
      }
    },
    async nextImageInGroup() {
      if (!this.hasGroup) {
        return;
      }

      try {
        let next = await this.imageGroupLink.fetchNext();
        if(!next.id) {
          this.$notify({type: 'error', text: this.$t('notif-error-last-image')});
        }
        else {
          let slice = await next.fetchReferenceSlice();
          await this.$store.dispatch(this.imageModule + 'setImageInstance', {image: next, slices: [slice]});
        }
      }
      catch(error) {
        console.log(error);
        this.$notify({type: 'error', text: this.$t('notif-error-fetch-next-image')});
      }
    },

    shortkeyHandler(key) {
      if(!this.isActiveImage) { // shortkey should only be applied to active map
        return;
      }

      if(key === 'nav-next-image') {
        this.nextImage();
      }
      else if(key === 'nav-previous-image') {
        this.previousImage();
      }
      else if (key === 'nav-next-image-in-group') {
        this.nextImageInGroup();
      }
      else if (key === 'nav-previous-image-in-group') {
        this.previousImageInGroup();
      }
    },

    async fetchUsers() {
      this.users = (await this.project.fetchUsers()).array;
    },
    async fetchPresets() {
      this.presets = (await PresetCollection.fetchAll({
        filterKey: 'project',
        filterValue: this.project.id,
      })).array;

      /* Initialize the preset channels by using the preset id */
      this.presets.forEach(preset => {
        this.presetChannels[preset.id] = [];
      });
    },
    async fetchPresetChannels() {
      let presetChannels = (await PresetChannelCollection.fetchAll({
        filterKey: 'imageinstance',
        filterValue: this.image.id,
      })).array;

      /* Filter the preset channels by preset */
      presetChannels.forEach(pc => this.presetChannels[pc.preset].push(pc));
    },
    presetName(user) {
      let name = fullName(user);
      let id = (this.currentUser.isDeveloper) ? `(${this.$t('id')}: ${user.id})` : '';

      return `${name} ${id}`;
    },
    loadPreset() {
      if (!this.selectedPreset) {
        return;
      }

      let preset = this.presets.find(preset => preset.user === this.selectedPreset.id);

      /* Load the preset */
      this.presetChannels[preset.id].forEach(pc => {
        let indexApparentChannel = pc['channel'];

        this.$store.commit(this.imageModule + 'setApparentChannelGamma',
          {indexApparentChannel, gamma: pc['gamma']}
        );
        this.$store.commit(this.imageModule + 'setApparentChannelInverted',
          {indexApparentChannel, inverted: pc['inverted']}
        );
        this.$store.commit(this.imageModule + 'setApparentChannelBounds',
          {indexApparentChannel, bounds: {min: pc['min'], max: pc['max']}}
        );
        this.$store.commit(this.imageModule + 'setHistogramLogScale', pc['logScale']);
        this.$store.commit(this.imageModule + 'setIntensitiesByMinMax', pc['intMinMax']);
      });
    },
    async savePreset() {
      let preset = this.presets.find(preset => preset.user === this.currentUser.id);
      if (!preset) {
        /* Add the preset to the database */
        preset = await new Preset({
          project: this.project.id,
          user: this.currentUser.id,
          image: this.image.id,
        }).save();

        this.presets.push(preset);
        this.presetChannels[preset.id] = [];
      }

      /* Save the current configuration of each channel of the image */
      let apparentChannels = this.imageWrapper.colors.apparentChannels;
      for (let i = 0; i < apparentChannels.length; i++) {
        let properties = {
          image: this.image.id,
          preset: preset.id,
          gamma: apparentChannels[i].gamma,
          channel: apparentChannels[i].index,
          min: apparentChannels[i].bounds.min,
          max: apparentChannels[i].bounds.max,
          inverted: apparentChannels[i].inverted,
          intMinMax: this.imageWrapper.colors.intensitiesByMinMax,
          logScale: this.imageWrapper.colors.histogramLogScale,
        };

        /* Add id of preset channel if it already exists */
        Object.assign(properties, {id: this.presetChannels[preset.id][i]?.id});

        this.presetChannels[preset.id][i] = await new PresetChannel(properties).save();
      }
    }
  },
  async created() {
    try {
      await Promise.all([
        this.fetchUsers(),
        this.fetchPresets(),
        this.fetchPresetChannels(),
      ]);
    }
    catch(error) {
      console.log(error);
    }
  },
  mounted() {
    this.$eventBus.$on('shortkeyEvent', this.shortkeyHandler);
  },
  beforeDestroy() {
    this.$eventBus.$off('shortkeyEvent', this.shortkeyHandler);
  }
};
</script>

<style scoped>
.table {
  margin-bottom: 0 !important;
  width: 100%;
  table-layout: fixed;
}

td {
  word-wrap: break-word;
}

td:first-child {
  width: 10em;
}

.buttons-wrapper {
  padding: 0;
}

.actions {
  padding-left: 0;
  padding-right: 0;
}

.buttons {
  justify-content: center;
}

.buttons.navigation {
  margin-top: 0.7em;
  margin-bottom: 0;
  border-width: 0;
}

.fa-angle-left {
  margin-right: 0.4em;
}

.fa-angle-right {
  margin-left: 0.4em;
}
</style>

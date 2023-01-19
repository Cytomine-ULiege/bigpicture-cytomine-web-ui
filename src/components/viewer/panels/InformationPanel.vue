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
        <td><strong>{{ $t('image-metadata') }}</strong></td>
        <td>
          <button class="button is-small" @click="isMetadataModalActive = true">
            {{ $t('button-metadata') }}
          </button>
        </td>
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
            <button class="button is-small" @click="reset()">{{$t('button-reset')}}</button>
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
            <a class="button is-small" v-if="canDownloadImages" :href="image.downloadURL">
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

  <image-metadata-modal
    :active.sync="isMetadataModalActive"
    :image="image"
  />
</div>
</template>

<script>
import {getAllTerms} from '@/utils/ontology-utils';
import {get} from '@/utils/store-helpers';
import {fullName} from '@/utils/user-utils.js';

import ImageMetadataModal from '@/components/image/ImageMetadataModal';
import ImageName from '@/components/image/ImageName';
import CalibrationModal from '@/components/image/CalibrationModal';

import {
  Preset,
  PresetChannel,
  PresetImage,
  PresetLayer,
  PresetOntology,
  PresetCollection,
  PresetChannelCollection,
  PresetImageCollection,
  PresetLayerCollection,
  PresetOntologyCollection,
  ProjectDefaultLayerCollection,
} from 'cytomine-client';

export default {
  name: 'information-panel',
  components: {
    ImageMetadataModal,
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
      isMetadataModalActive: false,
      users: [],
      presets: [],
      presetImage: {},
      presetChannels: {},
      presetLayers: {},
      presetOntologies: {},
      selectedPreset: null,
      defaultLayers: [],
    };
  },
  computed: {
    currentUser: get('currentUser/user'),
    ontology: get('currentProject/ontology'),
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
    canDownloadImages() {
      // Virtual images (null path) cannot be downloaded.
      return this.image.path !== null && (
        this.canManageProject ||
        ((this.$store.state.currentProject.project || {}).areImagesDownloadable) || false
      );
    },
    canManageProject() {
      return this.$store.getters['currentProject/canManageProject'];
    },
    isActiveImage() {
      return this.viewerWrapper.activeImage === this.index;
    },
    availablePresets() {
      let userIds = this.presets.map(preset => preset.user);
      return this.users.filter(user => userIds.includes(user.id));
    },
    terms() {
      return getAllTerms(this.ontology);
    },
    termsMapping() {
      let mapping = {};
      let terms = this.imageWrapper.style.terms;
      terms.forEach((term, idx) => mapping[term.id] = idx);
      return mapping;
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
      this.users = (await this.project.fetchUserLayers()).array;
    },
    async fetchDefaultLayers() {
      this.defaultLayers = await ProjectDefaultLayerCollection.fetchAll({
        filterKey: 'project',
        filterValue: this.project.id
      });
    },
    async fetchPresets() {
      this.presets = (await PresetCollection.fetchAll({
        filterKey: 'project',
        filterValue: this.project.id,
      })).array;

      /* Initialize the preset channels by using the preset id */
      this.presets.forEach(preset => {
        this.presetChannels[preset.id] = [];
        this.presetLayers[preset.id] = [];
        this.presetOntologies[preset.id] = [];
      });
    },
    async fetchPresetImage() {
      let presetImage = (await PresetImageCollection.fetchAll({
        filterKey: 'imageinstance',
        filterValue: this.image.id,
      })).array;

      /* Filter the preset image by preset */
      presetImage.forEach(pi => this.presetImage[pi.preset] = pi);
    },
    async fetchPresetChannels() {
      let presetChannels = (await PresetChannelCollection.fetchAll({
        filterKey: 'imageinstance',
        filterValue: this.image.id,
      })).array;

      /* Filter the preset channels by preset */
      presetChannels.forEach(pc => this.presetChannels[pc.preset].push(pc));
    },
    async fetchPresetLayers() {
      let presetLayers = (await PresetLayerCollection.fetchAll({
        filterKey: 'imageinstance',
        filterValue: this.image.id,
      })).array;

      /* Filter the preset layers by preset */
      presetLayers.forEach(pl => this.presetLayers[pl.preset].push(pl));
    },
    async fetchPresetOntologies() {
      let presetOntologies = (await PresetOntologyCollection.fetchAll({
        filterKey: 'imageinstance',
        filterValue: this.image.id,
      })).array;

      /* Filter the preset ontologies by preset */
      presetOntologies.forEach(po => this.presetOntologies[po.preset].push(po));
    },
    presetName(user) {
      let name = fullName(user);
      let id = (this.currentUser.isDeveloper) ? `(${this.$t('id')}: ${user.id})` : '';

      return `${name} ${id}`;
    },
    reset() {
      this.$store.dispatch(this.viewerModule + 'setRotation', {
        index: this.index,
        rotation: 0
      });

      this.$store.commit(this.imageModule + 'resetApparentChannels');

      /* Remove all the annotation layers */
      let selectedLayers = this.$store.getters[this.imageModule + 'selectedLayers'];
      let length = selectedLayers.length;

      for (let i = 0; i < length; i++) {
        this.$store.dispatch(this.imageModule + 'removeLayer', 0);
      }

      /* Reset to the default layers */
      this.defaultLayers.forEach(defaultLayer => {
        let layer = this.users.find(user => user.id === defaultLayer.user);
        layer.visible = true;
        this.$store.dispatch(this.imageModule + 'addLayer', layer);
      });

      /* Reset the ontology */
      let termStyles = this.imageWrapper.style.terms;
      for (let i = 0; i < this.terms.length; i++) {
        let index = this.termsMapping[this.terms[i].id];
        if (!termStyles[this.termsMapping[this.terms[i].id]].visible) {
          this.$store.dispatch(this.imageModule + 'toggleTermVisibility', index);
        }

        this.$store.commit(this.imageModule + 'resetTermOpacities');
      }

      this.$notify({type: 'success', text: this.$t('notif-sucess-reset-preset')});
    },
    loadPreset() {
      if (!this.selectedPreset) {
        return;
      }

      let preset = this.presets.find(preset => preset.user === this.selectedPreset.id);
      if (!(preset.id in this.presetImage)) {
        return;
      }

      /* Load the preset of the image */
      this.$store.dispatch(this.viewerModule + 'setRotation', {
        index: this.index,
        rotation: Number(this.presetImage[preset.id]['rotation']),
      });

      this.$store.dispatch(this.imageModule + 'setActiveSliceByPosition', {
        channel: this.presetImage[preset.id]['c'],
        zStack: this.presetImage[preset.id]['z'],
        time: this.presetImage[preset.id]['t'],
      });

      /* Load the preset of the channels of the image */
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

        if (pc['color']) {
          this.$store.commit(this.imageModule + 'setApparentChannelColor',
            {indexApparentChannel, color: pc['color'], isColormap: false}
          );
        }

        this.$store.dispatch(this.imageModule + 'setApparentChannelVisibility',
          {indexApparentChannel, visible: pc['visible']}
        );
      });

      let selectedLayers = this.$store.getters[this.imageModule + 'selectedLayers'];
      let length = selectedLayers.length;

      /* Remove loaded annotation layers */
      for (let i = 0; i < length; i++) {
        this.$store.dispatch(this.imageModule + 'removeLayer', 0);
      }

      /* Load the preset of the annotation layers */
      this.presetLayers[preset.id].forEach(pl => {
        let layer = this.users.find(user => user.id === pl.user);
        layer.visible = pl.visible;
        layer.drawOn = pl.drawOn;

        this.$store.commit(this.imageModule + 'setLayersOpacity', Number(pl.opacity));
        this.$store.dispatch(this.imageModule + 'addLayer', layer);
      });

      /* Load the preset of the ontology */
      for (let i = 0; i < this.terms.length; i++) {
        let index = this.termsMapping[this.terms[i].id];
        if (!this.presetOntologies[preset.id][i].visible) {
          this.$store.dispatch(this.imageModule + 'toggleTermVisibility', index);
        }

        let opacity = this.presetOntologies[preset.id][i].opacity;
        this.$store.commit(this.imageModule + 'setTermOpacity', {indexTerm: index, opacity});
      }

      this.$notify({type: 'success', text: this.$t('notif-success-preset-loaded')});
    },
    async savePresetImage(preset) {
      let currentSlice = this.imageWrapper.activeSlices[0];
      this.presetImage[preset.id] = await new PresetImage({
        id: this.presetImage[preset.id]?.id,
        image: this.image.id,
        preset: preset.id,
        rotation: this.imageWrapper.view.rotation,
        c: currentSlice.channel,
        z: currentSlice.zStack,
        t: currentSlice.time,
      }).save();
    },
    async savePresetChannels(preset) {
      /* Save the current configuration of each channel of the image */
      let apparentChannels = this.imageWrapper.colors.apparentChannels;
      for (let i = 0; i < apparentChannels.length; i++) {
        this.presetChannels[preset.id][i] = await new PresetChannel({
          id: this.presetChannels[preset.id][i]?.id,
          image: this.image.id,
          preset: preset.id,
          gamma: apparentChannels[i].gamma,
          channel: apparentChannels[i].index,
          min: apparentChannels[i].bounds.min,
          max: apparentChannels[i].bounds.max,
          inverted: apparentChannels[i].inverted,
          intMinMax: this.imageWrapper.colors.intensitiesByMinMax,
          logScale: this.imageWrapper.colors.histogramLogScale,
          visible: apparentChannels[i].visible,
          color: apparentChannels[i].color,
        }).save();
      }
    },
    async savePresetLayers(preset) {
      /* Save the selected annotation layers currently displayed */
      let selectedLayers = this.imageWrapper.layers.selectedLayers;
      for (const layer of selectedLayers) {
        /* Find if the layer is already registered in the preset */
        let index = this.presetLayers[preset.id].findIndex(pl => {
          return pl.user === layer.id;
        });

        let pl = await new PresetLayer({
          id: this.presetLayers[preset.id][index]?.id,
          image: this.image.id,
          preset: preset.id,
          user: layer.id,
          opacity: this.imageWrapper.style.opacity,
          drawOn: layer.drawOn,
          visible: layer.visible,
        }).save();

        if (index >= 0) {
          this.presetLayers[preset.id][index] = pl;
        }
        else {
          this.presetLayers[preset.id].push(pl);
        }
      }

      /* Remove the annotation layers that are not displayed anymore */
      let userIds = selectedLayers.map(user => user.id);
      let toDelete = this.presetLayers[preset.id].filter(pl => !userIds.includes(pl.user));
      for (const layer of toDelete) {
        await layer.delete();
      }
      /* Remove the deleted layers from the data */
      this.presetLayers[preset.id] = this.presetLayers[preset.id].filter(pl => !toDelete.includes(pl));
    },
    async savePresetOntology(preset) {
      let termStyles = this.imageWrapper.style.terms;
      for (let i = 0; i < this.terms.length; i++) {
        this.presetOntologies[preset.id][i] = await new PresetOntology({
          id: this.presetOntologies[preset.id][i]?.id,
          image: this.image.id,
          preset: preset.id,
          term: this.terms[i].id,
          opacity: termStyles[this.termsMapping[this.terms[i].id]].opacity,
          visible: termStyles[this.termsMapping[this.terms[i].id]].visible,
        }).save();
      }
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
        this.presetLayers[preset.id] = [];
        this.presetOntologies[preset.id] = [];
      }

      await this.savePresetImage(preset);
      await this.savePresetChannels(preset);
      await this.savePresetLayers(preset);
      await this.savePresetOntology(preset);

      this.$notify({type: 'success', text: this.$t('notif-success-preset-saved')});
    }
  },
  async created() {
    try {
      await Promise.all([
        this.fetchUsers(),
        this.fetchDefaultLayers(),
        this.fetchPresets(),
        this.fetchPresetImage(),
        this.fetchPresetChannels(),
        this.fetchPresetLayers(),
        this.fetchPresetOntologies(),
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

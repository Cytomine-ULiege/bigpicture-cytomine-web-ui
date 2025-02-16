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
<cytomine-modal-card :title="$t('about-cytomine')" @close="$parent.close()">
  <template>
    <dl>
      <dt>{{$t('version')}}</dt>
      <dd>{{version || '?'}}
        <template v-if="constants['CYTOMINE_FLAVOR']">({{constants['CYTOMINE_FLAVOR'] || '?'}})</template>
        <b-collapse :open="false">
          <template #trigger="{open}">
            <button class="button is-small">
              {{$t(open ? 'button-hide' : 'button-show')}}
            </button>
          </template>
          <dl>
            <template v-for="component in componentsInfos" >
              <dt :key="`${component.name}-dt`" :class="{'has-text-grey': !component.enabled}">
                {{component.name}}
                <span v-if="!component.enabled" class="is-italic is-lowercase"> ({{$t('disabled')}})</span>
              </dt>
              <dd :key="component.name">
                <div class="tags has-addons">
                  <span class="tag">{{component.namespace || '?'}}</span>
                  <span class="tag is-primary">{{component.version || '?'}}</span>
                </div>
              </dd>
            </template>
          </dl>
        </b-collapse>
      </dd>

      <dt>{{$t('sponsors')}}</dt>
      <dd>
        <a href="https://cytomine.coop" target="_blank">
          <img src="@/assets/sponsors/logo-cytomine-coop.png" class="sponsor">
        </a>
        <a href="https://www.uliege.be" target="_blank">
          <img src="@/assets/sponsors/logo-uliege.png" class="sponsor">
        </a>
        <a href="https://www.wallonie.be/" target="_blank">
          <img src="@/assets/sponsors/logo-wallonie.png" class="sponsor">
        </a>
      </dd>

      <dt>{{$t('description')}}</dt>
      <dd>
        <i18n path="cytomine-sponsors-info">
          <a place="cytomineCompanyLink" href="https://cytomine.coop" target="_blank">
            {{$t('cytomine-company')}}</a>
        </i18n>
      </dd>

      <dt>{{$t('website')}}</dt>
      <dd>
        <i18n path="cytomine-website-info">
          <a place="websiteLink" href="https://cytomine.coop" target="_blank">cytomine.org</a>
        </i18n>
      </dd>

      <dt>{{$t('source-code')}}</dt>
      <dd>
        <i18n path="source-code-info">
          <a place="githubLink" href="http://github.com/cytomine/" target="_blank">
            {{$t('github-repository')}}</a>
        </i18n>
      </dd>

      <dt>{{$t('documentation')}}</dt>
      <dd>
        <i18n path="documentation-info">
          <a place="docLink" href="https://documentation.cytomine.org/" target="_blank">{{$t('here')}}</a>
        </i18n>
      </dd>

      <dt>{{$t('contact')}}</dt>
      <dd>
        <i18n path="contact-info">
          <a place="contactMail" href="mailto:info@cytomine.org">info@cytomine.org</a>
        </i18n>
      </dd>
    </dl>
  </template>
</cytomine-modal-card>
</template>

<script>
import {Cytomine} from 'cytomine-client';
import constants from '@/utils/constants.js';
import CytomineModalCard from '@/components/utils/CytomineModalCard';

export default {
  name: 'about-cytomine-wrapper',
  components: {CytomineModalCard},
  data() {
    return {
      version: constants.CYTOMINE_COMMERCIAL_VERSION,
      coreVersion: null,
      loading: true,
      open: false,
    };
  },
  computed: {
    constants() {
      return constants;
    },
    componentsInfos() {
      return this.constants['COMPONENTS'].map(component => {
        return {
          'name': component,
          'enabled': constants[`${component}_ENABLED`] == null || constants[`${component}_ENABLED`],
          'version': constants[`${component}_VERSION`],
          'namespace': constants[`${component}_NAMESPACE`] || '-'
        };
      });
    }
  },
  async created() {
    try {
      let {version} = await Cytomine.instance.ping();
      this.coreVersion = (version) ? version : null;
    }
    catch(error) {
      console.log(error);
    }
    this.loading = false;
  }
};
</script>

<style scoped>
.modal-card, .modal-card-body {
  width: 50vw;
  min-width: 700px;
  font-weight: normal;
}

dt {
  float: left;
  width: 12rem;
  text-align: right;
  padding-right: 1rem;
  clear: both;
  font-weight: 600;
}

dd {
  margin-left: 14rem;
  background-color: #fff;
  margin-bottom: 0.75rem;
}

img.sponsor {
  max-height: 7rem;
  margin-right: 1rem;
}
</style>

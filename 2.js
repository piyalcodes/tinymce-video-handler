import React, {useState} from 'react';

import { Editor } from '@tinymce/tinymce-react';
import PropTypes from 'prop-types';

import './style.scss';

const CustomTextEditor = (props) => {

  const [deleteInProgress, setDeleteInProgress] = useState(false);


  const {
    disabled,
    imageUploadApi, imageDeleteApi,
    videoUploadApi, videoDeleteApi,
    setContent, contentId, storage,
    plugins, toolbar, menubar, height,
    contentStyle, content,
    extraInits
  } = props;

  const editorConfig = {
    plugins: [
      'advlist autolink lists link image charmap print preview anchor',
      'searchreplace visualblocks code fullscreen',
      'insertdatetime media mediaembed table paste code help wordcount'
    ],
    toolbar: `undo redo | formatselect | bold italic backcolor | 
                alignleft aligncenter alignright alignjustify | videoUpload deleteVideo deleteImage  | bullist numlist outdent indent 
                | removeformat |  link image | media live embeds uploads insertfile code fullscreen `,
    menubar: 'insert',
    height: '300px',
    content_style : `.mce-object-video { width: 100% } `
  };

  const tinyMceUploadAssets = async (data) => {
    return await videoUploadApi(data, contentId);
  };

  const tinyMceDeleteVideoAsset = async (deleteId) => {
    if (!deleteInProgress) {
      setDeleteInProgress(true);
      return await videoDeleteApi(deleteId, contentId);
    }
  };

  const enableEditor = () => {
    setDeleteInProgress(false);
  };

  const tinyMceDeleteImageAsset = async (deleteId) => {
    setDeleteInProgress(true);
    return await imageDeleteApi(deleteId, contentId);
  };

  const prepareEditorContentForSaving = (content) => {
    setContent(content);
  };


  return (<Editor
    apiKey="APIKEY"
    initialValue={content}
    disabled={disabled || deleteInProgress}
    init={{
      selector: 'textarea',
      tinydrive_token_provider: '',
      height: height || editorConfig.height,
      menubar: menubar || editorConfig.menubar,
      content_style: contentStyle || editorConfig.content_style,
      plugins: plugins || editorConfig.plugins,
      toolbar: toolbar || editorConfig.toolbar,
      valid_elements : 'a[href|target=_blank],strong/b,div[align],br, video, source',
      valid_children: 'video[source]',
      extended_valid_elements : 'video[*], video[source], video[controls|preload|width|height|data-setup],source[src|type], object[type|data|width|height|classid|codebase],param[name|value],embed[src|type|width|height|flashvars|wmode]',
      images_upload_base_path: '/',
      images_upload_credentials: true,
      media_live_embeds: true,
      cleanup: false,
      verify_html: false,
      schema: 'html5',
      images_upload_handler: async function(blobInfo, success, failure) {
        const response = await imageUploadApi(blobInfo, contentId);
        success(response[0].url);
      },
      setup: function(editor) {

        editor.ui.registry.addButton('videoUpload', {
          text: 'Upload Video',
          type: 'button',
          onAction: function(e) {

            let dialogConfig = {
              title: 'Insert a video',
              html: '',
              body: {
                type: 'panel',
                items: [
                  {
                    type: 'htmlpanel',
                    html: `<div><input type="file" id="uploadFile" name="Select a video" accept="video/*" /></div>`,
                    name: 'uploadFiles'
                  }
                ]
              },
              buttons: [
                {
                  type: 'cancel',
                  name: 'closeButton',
                  text: 'Cancel'
                },
                {
                  type: 'submit',
                  name: 'submitButton',
                  text: 'Insert',
                  primary: true
                }
              ],
              initialData: {
              },
              onCancel: function(api) {
                api.close();
              },
              onSubmit: async function(api) {

                if (document.getElementById('uploadFile') && document.getElementById('uploadFile').files) {
                  api.block('uploading ...');

                  const fileData = await tinyMceUploadAssets(document.getElementById('uploadFile').files);

                  const content = `<div class="help-center-video-content video-wrapper" style="text-align:center" id="${fileData[0].id}">
                              <video class="help-center-video" width="90%" height="240" controls src="${fileData[0].url}" id="${fileData[0].id}"
                              data-filename="${fileData[0].fileName}" ></video> 
                          </div>`;
                  editor.selection.setContent(content);
                  api.close();

                }
              }
            };
            editor.windowManager.open(dialogConfig);
          }
        });

        editor.ui.registry.addButton('deleteImage', {
          text: 'Delete Image',
          title : 'Delete Image',
          onAction: async function(e) {
            let selectedTag = editor.selection.getNode();
            if (selectedTag.tagName.toLowerCase() === 'img') { // delete uploaded image
              if (storage && selectedTag.dataset['mceSrc'] && selectedTag.dataset['mceSrc'].indexOf(storage) !== -1) {
                const deleteId = selectedTag.dataset['mceSrc'].split('/').pop();
                await tinyMceDeleteImageAsset(deleteId);
                selectedTag.remove();
                enableEditor();
              }
            }
          }
        });

        editor.ui.registry.addButton('deleteVideo', {
          text: 'Delete Video',
          title : 'Delete Video',
          onAction: async function(e) {

            let selectedTag = editor.selection.getNode();
            const id = selectedTag.id || selectedTag.dataset['mcePId'];
            await tinyMceDeleteVideoAsset(id);
            selectedTag.closest(`.video-wrapper`).remove();
            enableEditor();

          }
        });
      },

      init_instance_callback:  function(editor) {
      },
      ...extraInits
    }}
    onEditorChange={(content) => prepareEditorContentForSaving(content)}
  />);

};

CustomTextEditor.propTypes = {
  content: PropTypes.string,
  setContent: PropTypes.func,
  disabled: PropTypes.bool,
  imageUploadApi: PropTypes.func,
  imageDeleteApi: PropTypes.func,
  videoUploadApi: PropTypes.func,
  videoDeleteApi: PropTypes.func,
  storage: PropTypes.string,
  contentId: PropTypes.string,
  plugins: PropTypes.array,
  toolbar: PropTypes.string,
  menubar: PropTypes.string,
  height: PropTypes.string,
  contentStyle: PropTypes.string,
  customSetupFunctions: PropTypes.func,
  customCallbackFunctions: PropTypes.func,
  extraInits: PropTypes.array
};

CustomTextEditor.defaultProps = {
  content: null,
  disabled: false,
  imageUploadApi: Function.prototype,
  imageDeleteApi: Function.prototype,
  videoUploadApi: Function.prototype,
  videoDeleteApi: Function.prototype,
  storage: null,
  contentId: null,
  customSetupFunctions: Function.prototype,
  customCallbackFunctions: Function.prototype,
  extraInits: []
};

export default CustomTextEditor;


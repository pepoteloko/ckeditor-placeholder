/**
 * A plugin to enable placeholder tokens to be inserted into the CKEditor message. Use on its own or with the placeholder plugin.
 * The default format is compatible with the placeholders syntex
 *
 * @version 0.2
 * @Author Troy Lutton
 * @Author Josep Rius
 * @license MIT
 *
 * This is a pure modification for the placeholders plugin. All credit goes to Stuart Sillitoe for creating the original (stuartsillitoe.co.uk)
 * Modified version to use in SmartPanel by Josep Rius
 */
CKEDITOR.plugins.add("placeholder_select", {
    lang: ["en", "de", "el", "ca", "es"],
    requires: ["richcombo", "widget"],
    init: function (editor) {
        //  array of placeholders to choose from that'll be inserted into the editor
        var placeholders = {};

        // init the default config - empty placeholders
        var defaultConfig = {
            format: "[[%placeholder%]]",
            placeholders: [],
        };

        // merge defaults with the passed in items
        var config = CKEDITOR.tools.extend(
            defaultConfig,
            editor.config.placeholder_select || {},
            true
        );

        // Crea el conjunto de placeholders
        for (var i = 0; i < config.placeholders.length; i++) {
            var placeholder = config.placeholders[i];

            // Define el formato del placeholder a insertar
            var formattedPlaceholder = config.format.replace("%placeholder%", placeholder.value);

            // Si no existe el grupo lo creamos
            if (!placeholders[placeholder.group]) {
                placeholders[placeholder.group] = [];
            }

            // Añadir el placeholder al grupo correspondiente
            placeholders[placeholder.group].push([formattedPlaceholder, placeholder.name, placeholder.value]);
        }

        // Registramos widget
        editor.widgets.add('placeholder', {
            allowedContent: 'span[data-placeholder]',
            requiredContent: 'span[data-placeholder]',
            upcast: function(el) {
                return el.name === 'span' && el.attributes['data-placeholder'];
            },
            init: function() {
                this.element.setAttribute('contenteditable', 'false');
                this.element.setStyle('display', 'inline-block');
                this.element.setStyle('background', '#eaf5d1');
                this.element.setStyle('border', '1px solid #95c11f');
                this.element.setStyle('color', '#4a6b0b');
                this.element.setStyle('font-size', '0.9em');
                this.element.setStyle('border-radius', '3px');
                this.element.setStyle('padding', '0 4px');
                this.element.setStyle('margin', '0 2px');
                this.element.setStyle('cursor', 'default');
            }
        });

        // RichCombo dropdown
        editor.ui.addRichCombo("placeholder_select", {
            label: editor.lang.placeholder_select.dropdown_label,
            title: editor.lang.placeholder_select.dropdown_title,
            voiceLabel: editor.lang.placeholder_select.dropdown_voiceLabel,
            className: "cke_format",
            multiSelect: false,
            panel: {
                css: [CKEDITOR.skin.getPath("editor")].concat(editor.config.contentsCss),
                voiceLabel: editor.lang.placeholder_select.panelVoiceLabel
            },

            init: function () {
                for (var group in placeholders) {
                    this.startGroup(group);
                    var items = placeholders[group];
                    for (var i = 0; i < items.length; i++) this.add(items[i][0], items[i][1], items[i][2]);
                }
            },

            onClick: function (value) {
                editor.focus();
                editor.fire("saveSnapshot");

                const sel = editor.getSelection();
                const range = sel && sel.getRanges()[0];
                if (!range) return;

                const selectedText = sel.getSelectedText();
                if (selectedText) range.deleteContents();

                const anchor = range.startContainer && range.startContainer.getAscendant('a', true);
                const isHTML = /<[^>]+>/.test(value);

                if (anchor) {
                    const textNode = editor.document.createText(value);
                    range.insertNode(textNode);
                    range.selectNodeContents(textNode);
                    sel.selectRanges([range]);
                } else if (isHTML) {
                    editor.insertHtml(value);
                } else {
                    const span = new CKEDITOR.dom.element('span', editor.document);
                    span.setAttribute('data-placeholder', value);
                    span.setText(value);
                    range.insertNode(span);
                    editor.widgets.initOn(span, 'placeholder');
                    range.selectNodeContents(span);
                    sel.selectRanges([range]);
                }

                editor.fire("saveSnapshot");
            }
        });

        // Inicializamos widgets sobre el contenido existente cuando carga el editor
        editor.on('instanceReady', function() {
            editor.widgets.initOn(editor.document.getBody().getElementsByTag('span'), 'placeholder');
        });
    }
});

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
    requires: ["richcombo"],
    init: function (editor) {
        //  array of placeholders to choose from that'll be inserted into the editor
        var placeholders = {};

        // init the default config - empty placeholders
        var defaultConfig = {
            format: "[[%placeholder%]]", // format placeholder a inserir
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

        // Añadir el menú al editor
        editor.ui.addRichCombo("placeholder_select", {
            label: editor.lang.placeholder_select.dropdown_label,
            title: editor.lang.placeholder_select.dropdown_title,
            voiceLabel: editor.lang.placeholder_select.dropdown_voiceLabel,
            className: "cke_format",
            multiSelect: false,
            panel: {
                css: [CKEDITOR.skin.getPath("editor")].concat(editor.config.contentsCss),
                voiceLabel: editor.lang.placeholder_select.panelVoiceLabel,
            },

            init: function () {
                for (var group in placeholders) {
                    // Crea el grupo en el richCombo
                    this.startGroup(group);

                    // Añade hijos al grupo
                    var items = placeholders[group];
                    for (var i = 0; i < items.length; i++) {
                        this.add(items[i][0], items[i][1], items[i][2]);
                    }
                }
            },

            afterInit: function( editor ) {
                var placeholderReplaceRegex = /\{\{([^\[\]])+\}\}/g;

                editor.dataProcessor.dataFilter.addRules( {
                    text: function( text, node ) {
                        var dtd = node.parent && CKEDITOR.dtd[ node.parent.name ];

                        // Skip the case when the placeholder is in elements like <title> or <textarea>
                        // but upcast the placeholder in custom elements (no DTD).
                        if ( dtd && !dtd.span )
                            return;

                        return text.replace( placeholderReplaceRegex, function( match ) {
                            // Creating widget code.
                            var widgetWrapper = null,
                                innerElement = new CKEDITOR.htmlParser.element( 'span', {
                                    'class': 'cke_placeholder'
                                } );

                            // Adds placeholder identifier as innertext.
                            innerElement.add( new CKEDITOR.htmlParser.text( match ) );
                            widgetWrapper = editor.widgets.wrapElement( innerElement, 'placeholder' );

                            // Return outerhtml of the widget wrapper so it will be placed as a replacement.
                            return widgetWrapper.getOuterHtml();
                        } );
                    }
                } );
            },

            onClick: function(value) {
                editor.focus();
                editor.fire("saveSnapshot");

                const sel = editor.getSelection();
                const range = sel && sel.getRanges()[0];
                if (!range) return;

                // Esborrem text seleccionat si n'hi ha
                const selectedText = sel.getSelectedText();
                if (selectedText) {
                    range.deleteContents();
                }

                // Detectem si és HTML o un wildcard simple
                const isHTML = /<[^>]+>/.test(value);

                if (isHTML) {
                    // Inserim HTML tal qual, editable
                    editor.insertHtml(value);
                } else {
                    // Inserim un span no editable
                    const span = new CKEDITOR.dom.element('span', editor.document);
                    span.setAttribute('contenteditable', 'false');
                    span.setAttribute('data-placeholder', value);

                    // Estils inline verds
                    span.setAttribute('style', `
                        display:inline-block;
                        background:#eaf5d1;
                        border:1px solid #95c11f;
                        color:#4a6b0b;
                        font-size:0.9em;
                        border-radius:3px;
                        padding:0 2px;
                        margin:0 1px;
                        cursor:default;
                    `.replace(/\s+/g,' '));

                    span.setText(value);

                    range.insertNode(span);
                    range.selectNodeContents(span);
                    sel.selectRanges([range]);
                }

                editor.fire("saveSnapshot");
            }
        });
    },
});

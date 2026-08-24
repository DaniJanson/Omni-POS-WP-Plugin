<?php
/**
 * Omni POS GitHub Auto-Updater
 * Checks GitHub Releases API, hooks into WordPress native plugin updates,
 * and allows 1-click in-place updates.
 */

if (!defined('ABSPATH')) {
    exit;
}

class Omni_POS_Updater {

    private static $instance = null;
    private $plugin_slug = 'omni-pos';
    private $plugin_file = 'omni-pos/omni-pos.php';
    private $version = OMNI_POS_VERSION;
    private $github_repo = 'DaniJanson/Omni-POS-WP-Plugin'; // Default repository: owner/repo
    private $access_token = '';

    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct() {
        // Load saved GitHub repo settings
        $saved_repo = get_option('omni_pos_github_repo', 'DaniJanson/Omni-POS-WP-Plugin');
        if (!empty($saved_repo)) {
            $this->github_repo = trim($saved_repo);
        }
        $this->access_token = get_option('omni_pos_github_token', '');

        // Native WordPress Plugin Update Hooks
        add_filter('pre_set_site_transient_update_plugins', array($this, 'check_wp_plugin_updates'));
        add_filter('plugins_api', array($this, 'plugin_info_popup'), 20, 3);
        add_filter('upgrader_post_install', array($this, 'post_install_cleanup'), 10, 3);
    }

    public function get_github_repo() {
        return $this->github_repo;
    }

    public function set_github_repo($repo, $token = '') {
        $this->github_repo = sanitize_text_field(trim($repo));
        $this->access_token = sanitize_text_field(trim($token));
        update_option('omni_pos_github_repo', $this->github_repo);
        update_option('omni_pos_github_token', $this->access_token);
        delete_transient('omni_pos_github_release');
    }

    /**
     * Fetch latest release from GitHub API
     */
    public function get_latest_release($force = false) {
        $transient_key = 'omni_pos_github_release';
        if (!$force) {
            $cached = get_transient($transient_key);
            if ($cached !== false) {
                return $cached;
            }
        }

        if (empty($this->github_repo) || strpos($this->github_repo, '/') === false) {
            return false;
        }

        $url = 'https://api.github.com/repos/' . $this->github_repo . '/releases/latest';

        $args = array(
            'timeout' => 15,
            'headers' => array(
                'Accept' => 'application/vnd.github.v3+json',
                'User-Agent' => 'WordPress/Omni-POS-Updater',
            ),
        );

        if (!empty($this->access_token)) {
            $args['headers']['Authorization'] = 'token ' . $this->access_token;
        }

        $response = wp_remote_get($url, $args);
        $body = null;

        if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
            $body = json_decode(wp_remote_retrieve_body($response), true);
        }

        // Fallback: Check /tags if no formal Release created on GitHub yet
        if (!$body || !isset($body['tag_name'])) {
            $tags_url = 'https://api.github.com/repos/' . $this->github_repo . '/tags';
            $tags_res = wp_remote_get($tags_url, $args);
            if (!is_wp_error($tags_res) && wp_remote_retrieve_response_code($tags_res) === 200) {
                $tags_body = json_decode(wp_remote_retrieve_body($tags_res), true);
                if (!empty($tags_body) && is_array($tags_body) && isset($tags_body[0]['name'])) {
                    $first_tag = $tags_body[0];
                    $body = array(
                        'tag_name'     => $first_tag['name'],
                        'name'         => 'Omni POS ' . $first_tag['name'],
                        'body'         => 'Release tag ' . $first_tag['name'] . ' published on GitHub.',
                        'zipball_url'  => isset($first_tag['zipball_url']) ? $first_tag['zipball_url'] : ('https://github.com/' . $this->github_repo . '/archive/refs/tags/' . $first_tag['name'] . '.zip'),
                        'html_url'     => 'https://github.com/' . $this->github_repo . '/releases/tag/' . $first_tag['name'],
                        'published_at' => current_time('mysql'),
                    );
                }
            }
        }

        if (!$body || !isset($body['tag_name'])) {
            return false;
        }

        // Clean version tag: "v1.2.0" -> "1.2.0"
        $version = ltrim($body['tag_name'], 'vV');

        // Look for zip asset or fallback to zipball_url
        $download_url = isset($body['zipball_url']) ? $body['zipball_url'] : '';
        if (!empty($body['assets']) && is_array($body['assets'])) {
            foreach ($body['assets'] as $asset) {
                if (isset($asset['name']) && preg_match('/\.zip$/i', $asset['name'])) {
                    $download_url = $asset['browser_download_url'];
                    break;
                }
            }
        }

        $release_data = array(
            'tag_name'     => $body['tag_name'],
            'version'      => $version,
            'name'         => isset($body['name']) ? $body['name'] : $body['tag_name'],
            'body'         => isset($body['body']) ? $body['body'] : '',
            'published_at' => isset($body['published_at']) ? $body['published_at'] : '',
            'download_url' => $download_url,
            'html_url'     => isset($body['html_url']) ? $body['html_url'] : '',
            'prerelease'   => !empty($body['prerelease']),
        );

        // Cache for 6 hours
        set_transient($transient_key, $release_data, 6 * HOUR_IN_SECONDS);

        return $release_data;
    }

    /**
     * Check if an update is available comparing semver
     */
    public function check_for_update($force = false) {
        $latest = $this->get_latest_release($force);
        if (!$latest) {
            return array(
                'has_update'      => false,
                'current_version' => $this->version,
                'latest_version'  => $this->version,
                'error'           => 'Could not connect to GitHub repository: ' . $this->github_repo,
            );
        }

        $has_update = version_compare($latest['version'], $this->version, '>');

        return array(
            'has_update'      => $has_update,
            'current_version' => $this->version,
            'latest_version'  => $latest['version'],
            'release_name'    => $latest['name'],
            'changelog'       => $latest['body'],
            'published_at'    => $latest['published_at'],
            'download_url'    => $latest['download_url'],
            'github_url'      => $latest['html_url'],
            'repo'            => $this->github_repo,
        );
    }

    /**
     * Hook into WordPress native update transient
     */
    public function check_wp_plugin_updates($transient) {
        if (empty($transient->checked)) {
            return $transient;
        }

        $update_info = $this->check_for_update();
        if (!empty($update_info['has_update'])) {
            $item = (object) array(
                'id'            => 'omni-pos/' . $this->plugin_file,
                'slug'          => $this->plugin_slug,
                'plugin'        => $this->plugin_file,
                'new_version'   => $update_info['latest_version'],
                'url'           => $update_info['github_url'],
                'package'       => $update_info['download_url'],
                'icons'         => array(),
                'banners'       => array(),
                'banners_rtl'   => array(),
                'tested'        => '6.7',
                'requires_php'  => '7.4',
                'compatibility' => new stdClass(),
            );

            $transient->response[$this->plugin_file] = $item;
        }

        return $transient;
    }

    /**
     * Show plugin details popup in WP Admin
     */
    public function plugin_info_popup($result, $action, $args) {
        if ($action !== 'plugin_information') {
            return $result;
        }

        if (!isset($args->slug) || $args->slug !== $this->plugin_slug) {
            return $result;
        }

        $latest = $this->get_latest_release();
        if (!$latest) {
            return $result;
        }

        $info = new stdClass();
        $info->name = 'Omni POS - Modern Point of Sale';
        $info->slug = $this->plugin_slug;
        $info->version = $latest['version'];
        $info->author = '<a href="https://github.com/' . esc_attr($this->github_repo) . '">Omni Team</a>';
        $info->homepage = $latest['html_url'];
        $info->download_link = $latest['download_url'];
        $info->sections = array(
            'description' => 'Fast, standalone WooCommerce Point of Sale (POS) with offline-first hydration, multi-cashier shifts, and thermal printing.',
            'changelog'   => nl2br(esc_html($latest['body'])),
        );
        $info->banners = array();

        return $info;
    }

    /**
     * Fix destination directory after WordPress extracts GitHub zipball
     */
    public function post_install_cleanup($response, $hook_extra, $result) {
        global $wp_filesystem;

        if (!isset($hook_extra['plugin']) || $hook_extra['plugin'] !== $this->plugin_file) {
            return $result;
        }

        $plugin_folder = WP_PLUGIN_DIR . '/' . $this->plugin_slug;
        $proper_destination = $plugin_folder;

        // If GitHub extracted into something like "danis-omni-pos-abc1234", rename to "omni-pos"
        if (isset($result['destination']) && $result['destination'] !== $proper_destination) {
            $wp_filesystem->move($result['destination'], $proper_destination);
            $result['destination'] = $proper_destination;
        }

        // Re-activate plugin
        activate_plugin($this->plugin_file);

        return $result;
    }

    /**
     * Execute 1-Click Update from Omni POS Admin
     */
    public function perform_direct_update() {
        if (!current_user_can('update_plugins')) {
            return new WP_Error('forbidden', 'You do not have permission to update plugins.');
        }

        $update_info = $this->check_for_update(true);
        if (empty($update_info['has_update'])) {
            return new WP_Error('no_update', 'Plugin is already on the latest version (' . $this->version . ').');
        }

        $download_url = $update_info['download_url'];
        if (empty($download_url)) {
            return new WP_Error('no_download_url', 'No download URL available in the latest release.');
        }

        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
        require_once ABSPATH . 'wp-admin/includes/misc.php';

        $skin = new WP_Ajax_Upgrader_Skin();
        $upgrader = new Plugin_Upgrader($skin);

        // Append token if private repo
        if (!empty($this->access_token) && strpos($download_url, 'api.github.com') !== false) {
            $download_url = add_query_arg('access_token', $this->access_token, $download_url);
        }

        $result = $upgrader->upgrade($this->plugin_file);

        if (is_wp_error($result)) {
            return $result;
        } elseif ($result === false) {
            return new WP_Error('upgrade_failed', 'Plugin upgrade failed during installation.');
        }

        // Clear cached transients
        delete_transient('omni_pos_github_release');

        return array(
            'success'        => true,
            'old_version'    => $this->version,
            'new_version'    => $update_info['latest_version'],
            'message'        => 'Omni POS successfully updated to v' . $update_info['latest_version'] . '!',
        );
    }
}

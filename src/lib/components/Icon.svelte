<script lang="ts">
	// Material Symbols Rounded glyph. `name` is the ligature (e.g. "calendar_month").
	interface Props {
		name: string;
		size?: number;
		fill?: boolean;
		weight?: number;
		label?: string;
	}
	let { name, size = 22, fill = false, weight = 300, label }: Props = $props();
</script>

<span
	class="sym"
	class:fill
	style="font-size:{size}px; font-variation-settings:'FILL' {fill
		? 1
		: 0},'wght' {weight},'GRAD' 0,'opsz' {size};"
	aria-hidden={label ? undefined : 'true'}
	role={label ? 'img' : undefined}
	aria-label={label}>{name}</span
>

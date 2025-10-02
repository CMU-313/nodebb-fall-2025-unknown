<div class="btn-group bottom-sheet">
	<div class="input-group input-group-sm">
		<button class="btn btn-outline" type="button" component="topic/search">
			<i class="fa fa-search text-primary"></i>
		</button>
		<input type="text" 
			   class="form-control" 
			   component="topic/input" 
			   placeholder="[[recent:search-topics]]" 
			   value="{{{ if searchQuery }}}{searchQuery}{{{ end }}}"
			   autocomplete="off">
		<button class="btn btn-outline" type="button" component="topic/search/clear">
			<i class="fa fa-times"></i>
		</button>
	</div>
</div>

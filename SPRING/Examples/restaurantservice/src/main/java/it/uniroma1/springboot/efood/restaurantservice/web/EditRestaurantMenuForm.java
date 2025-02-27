package it.uniroma1.springboot.efood.restaurantservice.web;

import it.uniroma1.springboot.efood.restaurantservice.domain.*; 

import lombok.*; 

import java.util.*; 

@Data @NoArgsConstructor
public class EditRestaurantMenuForm {

	private List<MenuItem> menuItems;
	
	public EditRestaurantMenuForm(List<MenuItem> menuItems) {
		this.menuItems = menuItems; 
	}

}

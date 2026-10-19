package com.olivepress.security;

import com.olivepress.domain.Permission;
import com.olivepress.domain.Role;
import com.olivepress.domain.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class UserPrincipal implements UserDetails {

    private final User user;

    public UserPrincipal(User user) { this.user = user; }

    public Long getId() { return user.getId(); }
    public Role getRole() { return user.getRole(); }
    public String getFullName() { return user.getFullName(); }
    public User getUser() { return user; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        for (Permission p : user.getPermissions()) {
            authorities.add(new SimpleGrantedAuthority("PERM_" + p.name()));
        }
        return authorities;
    }

    public boolean hasPermission(Permission p) {
        return user.hasPermission(p);
    }

    @Override public String getPassword() { return user.getPasswordHash(); }
    @Override public String getUsername() { return user.getUsername(); }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return user.isActive(); }
}
